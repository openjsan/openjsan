package JSAN::Smoke;

use strict;
use Catalyst qw/-Debug Static/;

our $VERSION = '0.01';

JSAN::Smoke->config( name => 'JSAN::Smoke' );

JSAN::Smoke->setup;

sub default : Private {
    my ($self, $c) = @_;
    $c->res->output('Congratulations, JSAN::Smoke is on Catalyst!');
}

sub retrieve : Local {
    my ($self, $c) = @_;

    my $user_agent = JSAN::Smoke::M::CDBI::UserAgent->find_or_create({
        name => $c->req->user_agent,
    });    

    my ($next_to_test) = JSAN::Smoke::M::CDBI::Distributions->search_next_test(
        $user_agent->id,
    );

    if ( $next_to_test && $next_to_test->id ) {
        my $running_test = JSAN::Smoke::M::CDBI::RunningTest->create({
            user_agent    => $user_agent->id,
            distributions => $next_to_test->id,
        });

        $c->res->cookies->{running_test} = { value => $running_test->id };
        my $smoke = join "/", '',
                              'src', 
                              $next_to_test->author->hash,
                              $next_to_test->srcdir,
                              'tests',
                              'smoke.html';
        $c->res->redirect( $smoke );    
        #$c->res->redirect( "/test/" . $next_to_test->filename . "/tests/smoke.html" );    
    }
    else {
        $c->res->output('No more work to be done. Thanks for stopping by!');    
        $c->res->headers->header( 'refresh' => 60 * 60 );
    }
}

sub report : Local {
    my ($self, $c) = @_;    

    my $run_id = $c->req->cookies->{running_test}->value;
    my $run = JSAN::Smoke::M::CDBI::RunningTest->retrieve( $run_id );

    my $params = {
        user_agent    => $run->user_agent,
        distributions => $run->distributions,
        started_on    => $run->started_on,
        success       => $c->req->param( 'success' ),
    };

    $params->{failure_text} = $c->req->param( 'failures' )
        unless $params->{success};

    JSAN::Smoke::M::CDBI::SmokeTest->create( $params );

    $run->delete;

    $c->res->redirect( '/retrieve' );
}

1;

__END__

=pod

=head1 NAME

JSAN::Smoke - Catalyst based application

=head1 SYNOPSIS

    script/jsan_smoke_server.pl

=head1 DESCRIPTION

Catalyst based application.

=head1 METHODS

=over 4

=item default

=item retrieve

=item report

=cut

=back

=head1 AUTHOR

Stevan Little

=head1 LICENSE

This library is free software . You can redistribute it and/or modify
it under the same terms as perl itself.

=cut

1;
