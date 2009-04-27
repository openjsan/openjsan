package JSAN::Data;
# $Id: $
use strict;
use warnings;

use Class::DBI::Loader;
use Class::DBI::Loader::Relationship;
use base qw[Class::Accessor::Fast];
use JSAN::Config;

our $CONFIG   = JSAN::Config->new;
our $DEBUG  ||= 0;
our $LOADER   = Class::DBI::Loader->new(
    debug         => $DEBUG,
    dsn           => 'dbi:Pg:host=localhost;dbname=' . $CONFIG->get('db'),
    user          => $CONFIG->dbauth->{user},
    password      => $CONFIG->dbauth->{pass},
    namespace     => __PACKAGE__,
    relationships => 0,
    options                 => { AutoCommit => 1 }, 
    additional_base_classes => 'JSAN::Data::Base',
);

#$LOADER->relationship($_) for
#  q[an author has distributions],
#  q[a distribution has namespaces],
#  q[a distribution has an author],
#  q[a namespace has a distribution];


__PACKAGE__->mk_accessors(qw[author distribution namespace trusted_client seed tag distribution_tag]);
sub new {
    my ($class, %args) = @_;
    my $self = $class->SUPER::new(\%args);
    $self->author($self->table('authors'));
    $self->distribution($self->table('distributions'));
    $self->namespace($self->table('namespaces'));
    $self->trusted_client($self->table('trusted_clients'));
    $self->seed($self->table('seeds'));
    $self->tag($self->table('tags'));
    $self->distribution_tag($self->table('distribution_tags'));
    
    return $self;
};

sub table {
    my ($self, $table) = @_;
    return $LOADER->find_class($table);
}

$LOADER->find_class('seeds')->uuid_columns('seed');

$LOADER->find_class('authors')->has_many(
    distributions =>
    $LOADER->find_class('distributions')
    => 'author'
);

$LOADER->find_class('distributions')->has_a(
    author => $LOADER->find_class('authors'),
);

$LOADER->find_class('distributions')->has_many(
    namespaces =>
    $LOADER->find_class('namespaces')
    => 'distribution'
);

$LOADER->find_class('seeds')->has_a(
    author => $LOADER->find_class('authors'),
);

$LOADER->find_class('distributions')->has_many(
    tags => [
        $LOADER->find_class('distribution_tags'),
        'tag',
    ],
    'distribution',
);

$LOADER->find_class('tags')->has_many(
    distributions => [
        $LOADER->find_class('distribution_tags'),
        'distribution',
    ],
    'tag',
);

$LOADER->find_class('distribution_tags')->has_a(
    tag => $LOADER->find_class('tags'),
);

$LOADER->find_class('distribution_tags')->has_a(
    distribution => $LOADER->find_class('distributions'),
);

package JSAN::Data::Base;
use Class::DBI::UUID;

1;

__END__
