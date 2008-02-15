#!/usr/bin/perl -w

use strict;
use Getopt::Long;
use Pod::Usage;
use Catalyst::Helper;

my $help = 0;

GetOptions( 'help|?' => \$help );

pod2usage(1) if ( $help || !$ARGV[0] );

my $helper = Catalyst::Helper->new;
pod2usage(1) unless $helper->mk_component( 'JSAN::Smoke', @ARGV );

1;

=head1 NAME

jsan_smoke_create.pl - Create a new Catalyst Component

=head1 SYNOPSIS

jsan_smoke_create.pl [options] model|view|controller name [helper] [options]

 Options:
   -help    display this help and exits

 Examples:
   jsan_smoke_create.pl controller My::Controller
   jsan_smoke_create.pl view My::View
   jsan_smoke_create.pl view MyView TT
   jsan_smoke_create.pl view TT TT
   jsan_smoke_create.pl model My::Model
   jsan_smoke_create.pl model SomeDB CDBI dbi:SQLite:/tmp/my.db
   jsan_smoke_create.pl model AnotherDB CDBI dbi:Pg:dbname=foo root 4321

 See also:
   perldoc Catalyst::Manual
   perldoc Catalyst::Manual::Intro

=head1 DESCRIPTION

Create a new Catalyst Component.

=head1 AUTHOR

Sebastian Riedel, C<sri\@oook.de>

=head1 COPYRIGHT

Copyright 2004 Sebastian Riedel. All rights reserved.

This library is free software. You can redistribute it and/or modify
it under the same terms as perl itself.

=cut
