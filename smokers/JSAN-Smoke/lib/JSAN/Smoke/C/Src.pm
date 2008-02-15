package JSAN::Smoke::C::Src;

use strict;
use base 'Catalyst::Base';

sub default : Private {
    my ( $self, $c ) = @_;
    $c->serve_static;
}

1;
__END__
