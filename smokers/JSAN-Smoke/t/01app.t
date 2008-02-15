use Test::More tests => 2;
use_ok( Catalyst::Test, 'JSAN::Smoke' );

ok( request('/')->is_success );
