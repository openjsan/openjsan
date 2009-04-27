use Module::Build;

my $class = Module::Build->subclass(
    class => 'My::Builder',
    code => q{
        sub ACTION_manifest {
            my $self = shift;
            $self->SUPER::ACTION_manifest(@_);
            $self->add_to_cleanup('MANIFEST.bak');
        }
        
        sub _write_default_maniskip {
            my $self = shift;
            my $file = shift || 'MANIFEST.SKIP';

            $self->SUPER::_write_default_maniskip($file);

            my $fh = IO::File->new(">> $file")
            or die "Can't open $file: $!";
            print $fh <<'EOF';
^Build.PL$
^DEVELOPER$
EOF
            $fh->close();
        }
    },
);

my $build = $class->new(
    module_name    => 'JSAN.Example',
    license        => 'perl',
    dist_author    => 'A. Thor <user@example.com>',
    dist_version   => '0.02',
    dist_abstract  => 'A Sample Lib',
    build_requires => {
        'Test.Simple' => '0.10',
    },
    requires => {
        'JSAN' => 0,
    },
);

$build->create_build_script;
