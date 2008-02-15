use strict;
use Catalyst::Build;

my $build = Catalyst::Build->new(
    create_makefile_pl => 'passthrough',
    license            => 'perl',
    module_name        => 'JSAN::Smoke',
    requires           => {
        'Catalyst' => '5.10',
        'Catalyst::Model::CDBI' => '0.08',
        'Catalyst::Plugin::Static' => '0.07',
        'Class::DBI' => '0.96',
        'Class::DBI::mysql' => '0.23',
    },
    create_makefile_pl => 'passthrough',
    script_files       => [ glob('script/*') ],
    test_files         => [ glob('t/*.t'), glob('t/*/*.t') ],
    dist_author => 'Rob Kinyon',
);
$build->create_build_script;
