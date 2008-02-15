package JSAN::Smoke::er;
use strict;
use warnings;

use Apache;
use Template;
use JSAN::Config;

sub handler {
    my $r = shift;
    my $c = JSAN::Config->new;
    Template->new(ABSOLUTE => 1, EVAL_PERL => 1)->process($c->get('site') . '/smokers/smoke.html', { r => $r }) or die Template->error;
    return 200;
}


1;


