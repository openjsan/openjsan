package JSAN::KwikiAuth;
use Kwiki::Users::Cookie -Base;

our $VERSION = "0.01";

const class_title => 'Kwiki users from Cookie JSAN lookup';
const user_class => 'JSAN::KwikiAuth::User';

package JSAN::KwikiAuth::User;
use base qw[Kwiki::User::Cookie];

use lib qw[../lib];
use JSAN::Server;

sub process_cookie {
    my ($seed) = shift;

    my $jsan = JSAN::Server->new;
    my $seed = $jsan->data->seed->search(seed => $seed);
    return unless $seed;
    $seed = $seed->first;
    return unless $seed;
    my $author = $seed->author;
    return unless $author;
    return $author->login;
}

1;

