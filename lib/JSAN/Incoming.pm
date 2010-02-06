package JSAN::Incoming;
# $Id: $
use strict;
use warnings;

use JSAN::Server;
use base qw[Class::Accessor::Fast];
use IO::All;
use Archive::Any;
use File::Path qw[mkpath];
use File::Basename qw[fileparse];
use version 0.77;
use File::Find::Rule;
use Pod::Simple::HTML;
use Template;
use Digest::MD5 qw[md5_hex];
use YAML qw/ DumpFile LoadFile /;
use XML::RSS;
use Time::Piece;
use JSON;
use Module::META::YAML;
use Module::META::JSON;
use HTML::Entities;

__PACKAGE__->mk_accessors(qw[
    file jsan dist dist_name tt htdocs lib_dir
    author author_hash
    html_dist_dir html_dist
    src_dist_name src_dist src_dist_dir
    history history_first history_latest
    archive
    doc_root doc_author doc_dist doc_dist_version
    js_libs js_ns pod_parser
    inline_doc inline_html_page
    dist_index_html_file
    meta_file_type dist_name dist_description dist_version
]);

sub new {
    my ($class, %args) = @_;
    my $obj = shift->SUPER::new({
        %args,
        jsan    => JSAN::Server->new,
        tt      => $class->_get_tt,
        lib_dir => 'lib',
    });
    $obj->htdocs($obj->jsan->config->get('site') . '/htdocs') unless $obj->htdocs;
    return $obj;
}

sub process {
    my ($self) = @_;

    $self->$_() for qw[
        _set_dist_name
        _find_dist_in_db
        _set_author
        _set_html_dist_dir
        _set_src_dist
        _update_dist_info
        _set_documentation_dir
        _setup_history
        _check_for_older
        _setup_archive
        _write_dist
        _write_src
        _set_dist_description
        _find_js_libs
    ];
    
    foreach my $js (keys %{ $self->js_libs }) {
        $self->$_($js) for qw[
            _get_js_name
            _get_js_version
            _set_namespace
            _get_lib_name
            _parse_inline_pod
            _setup_inline_html
            _create_js_inline_html
        ];
    }

    $self->$_() for qw[
        _set_dist_index_html_file
        _create_js_dist_index
        _create_author_index
        _create_js_dist_version_index
        _import_tags
    ];
}

sub process_site_level {
    my ($self) = @_;
    $self->$_() for qw[
        _create_master_yaml_index
        _create_recent_rss
        _create_tag_pages
    ];
}

sub process_existing {
    my ($self) = @_;

    $self->_set_dist_name;
    eval { $self->_find_dist_in_db };
    return if $@;
    $self->$_() for qw[
        _set_author
        _set_html_dist_dir
        _set_documentation_dir
        _set_src_dist
        _update_dist_info
        _setup_history
        _setup_archive
        _write_dist
        _set_dist_description
        _find_js_libs
    ];
    
    foreach my $js (keys %{ $self->js_libs }) {
        $self->$_($js) for qw[
            _get_js_name
            _get_js_version
            _set_namespace
            _get_lib_name
            _parse_inline_pod
            _setup_inline_html
            _create_js_inline_html
        ];
    }

    $self->$_() for qw[
        _set_dist_index_html_file
        _create_js_dist_index
        _create_author_index
        _create_js_dist_version_index
        _import_tags
    ];
}

sub _create_tag_pages {
    my ($self) = @_;
    my $tt = $self->tt;

    my $htdocs  = $self->htdocs;
    my @tags    = $self->jsan->data->tag->retrieve_all;

    foreach my $tag ( @tags ) {
        my $name = $tag->name;

        my @dists = (
            map  { $_->[1] }
            sort { $a->[0] cmp $b->[0] }
            map  { [ $_->name, $_ ] }
            $tag->distributions
        );

        $tt->process('tag_index_page', {
            title     => "Tag $name",
            page_file => "tag/$name/index.html",
            dists     => \@dists,
            tag       => $tag,
        }, "$htdocs/tag/$name/index.html") || die $tt->error;

    }
}

sub _import_tags {
    my ($self) = @_;

    my $meta = ($self->_get_meta())[0];
    return unless $meta;
    return unless $meta->keywords;

    my $dist = $self->dist;
    foreach my $tag ( @{$meta->keywords} ) {
        my $tag = $self->jsan->data->tag->find_or_create({name => $tag});
        $self->jsan->data->distribution_tag->find_or_create({
            distribution => $dist,
            tag          => $tag,
        });
    }
}

sub _create_recent_rss {
    my ($self) = @_;
    my @dists = sort { $b->cdate <=> $a->cdate }
                grep { $_->cdate } # only processed distributions
                     $self->jsan->data->distribution->retrieve_all;

    my $rss = XML::RSS->new( version => '1.0' );

    $rss->channel(
        title => "Recent JSAN Uploads",
        link  => 'http://openjsan.org/',
        description => "Recent JavaScript Distributions submitted to the JavaScript Archive Network (JSAN)",
        dc => {
            date => Time::Piece->new->datetime,
            subject => "Recent JSAN Uploads",
            creator => q[casey@geeknest.com],
            publisher => q[casey@geeknest.com],
            rights => q[Creative Commons],
            language => 'en-us',
        },
        syn => {
            updatePeriod => "hourly",
            updateFrequency => 1,
            updateBase => Time::Piece->new(1)->datetime,
        },
    );
    $rss->image(
        title => "JSAN",
        url   => q[http://openjsan.org/images/logo/jsan-logo-rhino.png],
        link  => q[http://openjsan.org/],
        dc    => {
            creator => "Marshall Roch",
        },
    );

    my $dist_class = $self->jsan->data->distribution;
    foreach my $dist ($dist_class->retrieve_from_sql(q{
        1 = 1 order by cdate desc limit 30
    })) {
        my $path = $dist->author->hash . '/'
                 . join('/',split /\./,$dist->name) . '/' . $dist->version;
        my $readme_path = $dist->author->hash . '/'
                 . $dist->name . '-' . $dist->version;
        $rss->add_item(
            title       => join('-', $dist->name, $dist->version),
            description => '<pre>' . encode_entities(
                $self->_load_readme($readme_path) || $dist->description || ''
            ) . '</pre>',
            'link'      => "http://openjsan.org/doc/$path",
            dc          => {
                date => Time::Piece->new($dist->cdate)->datetime,
            },
        );
    }
    io($self->htdocs . '/recent.rss') < $rss->as_string;
}

sub _load_readme {
    my $self = shift;
    my $path = $self->htdocs . '/src/' . shift;
    my $readme = $self->_find_file('readme', $path) or return;
    my $text = io($self->htdocs . '/' . $readme)->slurp;
    # cheap way to get rid of HTML constructs
    $text =~ s/<(\w)/&lt;$1/g;
    return $text;
}


sub _create_master_yaml_index {
    my ($self) = @_;

    my $index = {
        authors       => {},
        distributions => {},
        libraries     => {},
    };

    foreach my $author ( $self->jsan->data->author->retrieve_all ) {
        my $author_hash = join '/', reverse $author->login =~ /(((.).).+)/;
        $author->hash($author_hash) and $author->update unless $author->hash;

        my @dists = $author->distributions;
        next unless @dists;
        $index->{authors}->{$author->login} = {
            name     => $author->name,
            email    => $author->email,
            url      => $author->url,
            doc      => '/doc/' . $author->hash,
        };

        foreach my $dist ( @dists ) {
            my $name = $dist->name;

            next unless $dist->name; # unprocessed distribution in database
            $index->{distributions}->{$name}->{doc} =  '/doc/' . $author->hash . '/' . join('/',split /\./,$dist->name);

            $index->{distributions}->{$name}->{releases} = []
              unless $index->{distributions}->{$name}->{releases};

            my ($latest) = (
                map  { $_->[1] }
                sort { $a->[0] <=> $b->[0] }
                map  { [ qv($_->version) => $_ ] }
                $self->jsan->data->distribution->search(name => $name)
            )[-1];

            my ($meta_text, $type) = $self->_get_meta($dist);
            push @{ $index->{distributions}->{$name}->{releases} }, {
                version  => $dist->version,
                author   => $author->login,
                source   => '/dist/' . $author->hash . '/' . $dist->filename,
                doc      => '/doc/' . $author->hash . '/' . join('/',split /\./,$dist->name) . '/' . $dist->version,
                created  => $dist->cdate,
                checksum => $dist->checksum,
                latest   => ($dist == $latest ? 1 : 0),
                meta     => $meta_text,
                srcdir   => $dist->srcdir,
            };
            
            if ($dist == $latest) {
                foreach my $lib ( $dist->namespaces ) {
                    $index->{libraries}->{$lib->name} = {
                        version              => $lib->version,
                        distribution_name    => $dist->name,
                        distribution_version => $dist->version,
                        author               => $author->login,
                        doc                  => '/doc/' . $author->hash . '/' . join('/',split /\./,$dist->name) . '/' . $dist->version . '/lib/' . join('/', split /\./, $lib->name) . '.html',
                    };
                }
            }
        }
    }

    DumpFile($self->htdocs . '/index.yaml', $index);
}

sub _get_meta {
    my ($self, $dist) = @_;
    $dist ||= $self->dist;

    my $meta_file = join '/', $self->htdocs, 'src', $dist->author->hash, $dist->srcdir, 'META.yml';
    my $meta_text = '';
    my $type      = undef;
    if (-e $meta_file) {
        $self->meta_file_type('yml');
        $self->_fix_meta_yaml_file($meta_file);
        #warn "-------------- $meta_file\n";
        eval { $meta_text = Module::META::YAML->read($meta_file) };
        warn $@ if $@;
        return '' if $@;
    }

    $meta_file =~ s/\.yml$/.json/;
    if (-e $meta_file) {
        $self->meta_file_type('json');
        eval { $meta_text = Module::META::JSON->read($meta_file) };
        warn $@ if $@;
        return '' if $@;
    }

    return ($meta_text, $type);
}

sub _fix_meta_yaml_file {
    my ($self, $yaml_file) = @_;

    my $yaml = io($yaml_file)->slurp;

    # recommend instead of recommends
    $yaml =~ s/recommend:/recommends:/g;

    # new line at end of file
    $yaml .= "\n" unless $yaml =~ /\n\Z/;
    io($yaml_file) < $yaml;
}

sub _create_js_dist_version_index {
    my ($self) = @_;
    $self->_build_dist_version_html(
        author => $self->dist->author,
        dist   => $self->dist,
        htdocs => $self->htdocs,
    );
}

sub _create_author_index {
    my ($self) = @_;
    $self->_build_author_html(
        author => $self->dist->author,
        htdocs => $self->htdocs,
    );
}

sub _create_js_dist_index {
    my ($self) = @_;
    $self->_build_dist_html(
        libs   => [ map $_->{html_file}, values %{$self->js_libs} ],
        dist   => $self->dist,
        index  => $self->dist_index_html_file,
        htdocs => $self->htdocs,
    );
}

sub _set_dist_index_html_file {
    my ($self) = @_;
    my $dist = $self->doc_dist_version;
    my $indexfile = join '/', $dist, 'index.html';
    $self->dist_index_html_file($indexfile);
}

sub _create_js_inline_html {
    my ($self, $js) = @_;

    $self->_create_js_html(
        htmldir  => $self->html_dist_dir,
        htmlfile => $self->js_libs->{$js}->{html_file},
        js_src   => (scalar io($js)->slurp),
        js       => $js,
        html     => $self->js_libs->{$js}->{html},
        parser   => $self->pod_parser,
        htdocs   => $self->htdocs,
    );
}

sub _setup_inline_html {
    my ($self, $js) = @_;
    my $libfile = $self->js_libs->{$js}->{lib_file};
    $libfile =~ s/\.js$/.html/;
    my $htmlfile = join '/', $self->doc_dist_version, $libfile;
    
    $self->js_libs->{$js}->{html_file} = $htmlfile;
    
    mkpath $self->html_dist_dir;
}

sub _get_lib_name {
    my ($self, $js) = @_;

    my $srcdist = $self->src_dist;
    my ($libfile) = $js =~ m[$srcdist/(.+)];
    $self->js_libs->{$js}->{lib_file} = $libfile;
    $self->js_ns({}) unless $self->js_ns;
    $self->js_ns->{$js}->filename($libfile);
    $self->js_ns->{$js}->update;
}


sub _parse_inline_pod {
    my ($self, $js) = @_;
    
    $self->_copy_from_existing_html($js);
    
    return if $self->js_libs->{$js}->{html};

    my $parser = Pod::Simple::HTML->new;
    $self->pod_parser($parser);
    my $html;
    $self->js_libs->{$js}->{html} = '';
    $self->pod_parser->perldoc_url_prefix( "/go?l=" );
    $self->pod_parser->output_string(\($self->js_libs->{$js}->{html}));
    $self->pod_parser->bare_output(1);
    $self->pod_parser->parse_file($js);
    
    $self->js_libs->{$js}->{doc_file} = $js;

    $self->_parse_external_pod($js)         unless $self->js_libs->{$js}->{html};
}


sub _copy_from_existing_html {
    my ($self, $js) = @_;
    
    my $srcdist = $self->src_dist;
    
    my ($lib) = $js =~ m[$srcdist/lib/(.+)];
    $lib =~ s/\.js/\.html/;
    
    my $html_file = "$srcdist/doc/html/$lib";
    return unless -e $html_file;
    
    my $html;
    
    #slurping
    {
        local($/) ;
        open(my $fh, $html_file) or die "Cannot open $html_file: $!\n";
        $html = <$fh>;
        close $fh;
    }
    
    if ($html) {
        $self->js_libs->{$js}->{html} = $html;
        $self->js_libs->{$js}->{doc_file} = $html_file;
    }
}


sub _parse_external_pod {
    my ($self, $js) = @_;
    my $srcdist = $self->src_dist;
    my ($lib) = $js =~ m[$srcdist/lib/(.+)];
    $lib =~ s/\.js/\.pod/;
    my @pod = (
        "$srcdist/doc/pod/$lib",
        "$srcdist/lib/$lib",
        "$srcdist/doc/$lib",
    );
    foreach my $pod ( @pod ) {
        next unless -e $pod;

        my $parser = Pod::Simple::HTML->new;
        $self->pod_parser($parser);
        my $html;
        $self->js_libs->{$js}->{html} = '';
        $self->pod_parser->perldoc_url_prefix( "/go?l=" );
        $self->pod_parser->output_string(\($self->js_libs->{$js}->{html}));
        $self->pod_parser->bare_output(1);
        $self->pod_parser->parse_file($pod);

        if ($self->js_libs->{$js}->{html}) {
            $self->js_libs->{$js}->{doc_file} = $pod;
            last;
        }
    }
}

sub _set_namespace {
    my ($self, $js) = @_;
    my $ns = $self->jsan->data->namespace->find_or_create({
        distribution => $self->dist,
        name         => $self->js_libs->{$js}->{name},
        version      => $self->js_libs->{$js}->{version},
    });
    $self->js_ns({}) unless $self->js_ns;
    $self->js_ns->{$js} = $ns;
}

sub _get_js_name {
    my ($self, $js) = @_;
    my $srcdist = $self->src_dist;
    my $name = $js;
    $name =~ s[$srcdist/lib/][];
    $name =~ s[\.js$][];
    $name =~ s[/][.]g;
    $self->js_libs->{$js}->{name} = $name;
}

sub _get_js_version {
    my ($self, $js) = @_;
    my $srcdist = $self->src_dist;use Data::Dumper;
    my $libname = $self->js_libs->{$js}->{name};
    my $find    = qr/VERSION\s*(?:=|:)\s*[^\d._]*([\d._]+)/;
    my $code    = io($js)->slurp;
    my ($ver)   = $code =~ $find;
    $self->js_libs->{$js}->{version} = $ver;
}

sub _find_js_libs {
    my ($self) = @_;
    my @js = File::Find::Rule->
                         file->
                         name('*.js')->
                         in(join '/', $self->src_dist, $self->lib_dir);
    $self->js_libs({ map {$_, {}} @js });
}

sub _set_documentation_dir {
    my ($self) = @_;
    my $distdir = $self->dist->name;
    $distdir =~ s[\.][/]g;

    $self->doc_root(join '/', $self->htdocs, 'doc');
    $self->doc_author(join '/', $self->doc_root, $self->author_hash);
    $self->doc_dist(join '/', $self->doc_author, $distdir);
    $self->doc_dist_version(join '/', $self->doc_dist, $self->dist->version);
}

sub _write_src {
    my ($self) = @_;
    mkpath($self->src_dist_dir);
    $self->archive->extract($self->src_dist_dir);
}

sub _write_dist {
    my ($self) = @_;
    mkpath($self->html_dist_dir);
    io($self->html_dist)->print($self->file->slurp);
}

sub _setup_archive {
    my ($self) = @_;
    my $archive = Archive::Any->new($self->file->name);
    die "Couldn't read your archive format."
        unless $archive;
    die "Your archive is impolite or naughty"
        if $archive->is_impolite || $archive->is_naughty;
    $self->archive($archive);
}

sub _setup_history {
    my ($self) = @_;
    
    my @dists = $self->jsan->data->distribution->search(name => $self->dist->name);
    
    @dists = sort { version->parse($a->version) <=> version->parse($b->version) } @dists;

    $self->history(\@dists);
    $self->history_first($self->history->[0]);
    $self->history_latest($self->history->[-1]);

    die "You do not own this distribution!"
         if    $self->history_first != $self->dist
            && $self->history_first->author != $self->dist->author; # not right author
}

sub _check_for_older {
    my ($self) = @_;
    
    my $this_version        = $self->dist->version;
    my $current_release     = $self->history_latest->version;
    
    die "This distribution [$this_version] is older than the current release [$current_release]!"
         if $self->history_latest  != $self->dist; # older version
}

sub _update_dist_info {
    my ($self) = @_;
    my @parts   = split /-/, $self->src_dist_name;
    my $version = pop @parts;
    $self->dist->version($version);
    $self->dist->name(join '.', @parts);
    my $checksum = $self->_get_dist_checksum;
    $self->dist->checksum($checksum);
    $self->dist->cdate(time) unless $self->dist->cdate;
    $self->dist->srcdir($self->src_dist_name);
    $self->dist->description($self->dist_description);
    $self->dist->update;
}

sub _set_dist_description {
    my ($self) = @_;

    my $meta = ($self->_get_meta())[0];
    return unless $meta;

    $self->dist_description( $meta->{abstract}) if $meta->{abstract};
    $self->dist_name(        $meta->{name}    ) if $meta->{name};
    $self->dist_version(     $meta->{version} ) if $meta->{version};

    $self->_update_dist_info;
}

sub _get_dist_checksum {
    my ($self) = @_;
    my $dist_file = $self->html_dist;
       $dist_file = $self->file->name unless -f $dist_file;
    my $dist_data = io($dist_file)->slurp;
    my $checksum  = md5_hex($dist_data);
    return $checksum;
}

sub _set_src_dist {
    my ($self) = @_;
    my $srcdistnam = fileparse(
                         $self->html_dist,
                         qr/\.(?:zip|tgz|tar\.gz)/,
                     );
    my $srcdistdir = join '/', $self->htdocs, 'src', $self->author_hash;
    my $srcdist = join '/', $srcdistdir, $srcdistnam; 
    $self->src_dist_dir($srcdistdir);
    $self->src_dist_name($srcdistnam);
    $self->src_dist($srcdist);
}

sub _set_html_dist_dir {
    my ($self) = @_;
    my $htdistdir = join '/', $self->htdocs, 'dist', $self->author_hash;
    $self->html_dist_dir($htdistdir);
    my $htdist    = join '/', $htdistdir, $self->dist_name;
    $self->html_dist($htdist);
}

sub _set_author {
    my ($self) = @_;
    $self->author($self->dist->author);
    $self->_hash_author;

    if (!$self->dist->author->hash) {
        $self->dist->author->hash($self->author_hash);
        $self->dist->author->update;
    }
}

sub _set_dist_name {
    my ($self) = @_;
    $self->dist_name($self->file->filename);
}

sub _find_dist_in_db {
    my ($self) = @_;
    
    my $filename = $self->dist_name;
    
    my $dist = $self->jsan->data->distribution->search(
        filename => $filename,
    )->first;
    die "Distribution '$filename' is not in the database" unless $dist;
    $self->dist($dist);
}

sub _hash_author {
    my ($self) = @_;
    my $author = $self->author->login;
    my ($two, $one) = $author =~ /^((.).)/;
    my $hash = join '/', $one, $two, $author;
    $self->author_hash($hash);
}

sub _get_tt {
    my $tt = Template->new(
        INCLUDE_PATH => ['templates/src', 'templates/lib', 'templates/incoming'],
        PRE_PROCESS  => 'config/main',
        PROCESS      => 'site/wrapper',
        #OUTPUT       => '../../../htdocs',
        PRE_DEFINE   => {
            debug   => 0,
            rooturl => '/',
        },
        EVAL_PERL => 1,
    ) || die Template->error;
}

sub _create_js_html {
    my ($self, %args) = @_;
    my $tt = $self->tt;

    my ($shortfile) = $args{htmlfile} =~ m[$args{htdocs}/(.+)];

    $tt->process('js_html', {
        pod       => $args{html},
        title     => join(' ', $self->js_libs->{$args{js}}->{name}, $self->js_libs->{$args{js}}->{version} || ()),
        page_file => $shortfile,
        js_src    => $args{js_src},
        dist      => $self->dist,
    }, $args{htmlfile}) || die $tt->error;
}

sub _build_dist_html {
    my ($self, %args) = @_;
    my $tt = $self->tt;
    
    my ($shortfile) = $args{index} =~ m[$args{htdocs}/(.+)];
    my ($download) = $self->html_dist =~ m[$args{htdocs}(/.+)];
    my ($source) = $self->src_dist =~ m[$args{htdocs}(/.+)];
    $self->_get_meta;

    $tt->process('dist_index', {
        title     => $args{dist}->name,
        page_file => $shortfile,
        dist      => $args{dist},
        libs      => $args{libs},
        download  => $download,
        source    => $source,
        changes   => $self->_find_file('changes', $source),
        readme    => $self->_find_file('readme', $source),
        harness   => (
            $self->_find_file('index.html', "$source/tests")
         || $self->_find_file('index.html', "$source/t")
        ),
        ($self->meta_file_type
           ? ( meta => "$source/META." . $self->meta_file_type )
           : ( meta => '' )
        ),
    }, $args{index}) || die $tt->error;
}

sub _find_file {
    my ($self, $fn, $source) = @_;
    
    my $htdocs = $self->htdocs;
    $source =~ s/$htdocs\///;
    my ($file) = File::Find::Rule->new->file->name(qr/$fn/i)->maxdepth(1)->in(join '/', $htdocs, $source);
    return undef unless $file;
    $file =~ s/$htdocs\///;
    return $file;
}
sub _build_author_html {
    my ($self, %args) = @_;
    my $tt = $self->tt;

    my %dists;
    my @dists = sort { qv($a->version) <=> qv($b->version) }
                     $self->jsan->data->distribution->search(
                         author => $args{author},
                     );
    $dists{$_->name} = $_ for @dists;

    my $htdocs = $self->htdocs;
    $tt->process('author_index', {
        title     => $args{author}->name,
        author    => $args{author},
        page_file => "doc/" . $args{author}->login . "/index.html",
        dists     => [values %dists],
    }, "$htdocs/doc/" . $self->author_hash . "/index.html") || die $tt->error;
}

sub _build_dist_version_html {
    my ($self, %args) = @_;
    my $tt = $self->tt;

    my @dists = (
        map  { $_->[1] }
        sort { $b->[0] <=> $a->[0] }
        map  { [ qv($_->version) => $_ ] }
        $self->jsan->data->distribution->search(
            author => $args{author},
            name   => $args{dist}->name,
        )
    );

    my $file = join '/', $self->doc_dist, 'index.html';

    my $htdocs = $self->htdocs;
    $tt->process('dist_name_index', {
        title     => $args{dist}->name,
        author    => $args{author},
        page_file => $file,
        dists     => \@dists,
        dist      => $args{dist},
    }, $file) || die $tt->error;
}

1;
