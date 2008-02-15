package JSAN::Smoke::M::CDBI::Distributions;

use strict;

__PACKAGE__->has_a(author => 'JSAN::Smoke::M::CDBI::Authors');

__PACKAGE__->set_sql( next_test => q{
    SELECT distributions.id
    FROM distributions
    WHERE distributions.id NOT IN (
        SELECT smoke_test.distributions
          FROM smoke_test
         WHERE user_agent = ?
    ) ORDER BY distributions.cdate DESC
});

1;

__END__

=pod

=head1 NAME

JSAN::Smoke::M::CDBI::Distribution - CDBI Model Component Table Class

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

