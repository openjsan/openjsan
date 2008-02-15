package JSAN::Smoke::M::CDBI;

use strict;
use base 'Catalyst::Model::CDBI';
use JSAN::Config;

our $CONFIG   = JSAN::Config->new;

__PACKAGE__->config(
    dsn           => 'dbi:mysql:' . $CONFIG->get('db'),
    user          => $CONFIG->dbauth->{user},
    password      => $CONFIG->dbauth->{pass},
    options       => {},
    relationships => 1
);

1;

__END__

=pod

=head1 NAME

JSAN::Smoke::M::CDBI - CDBI Model Component

=head1 SYNOPSIS

    Very simple to use

=head1 DESCRIPTION

Very nice component.

=head1 AUTHOR

Clever guy

=head1 LICENSE

This library is free software . You can redistribute it and/or modify it under
the same terms as perl itself.

=cut

1;

