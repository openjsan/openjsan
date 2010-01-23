package JSAN::Config;
use strict;
use warnings;

use JSON;

our $CONFIG;

sub new {
    return $CONFIG if $CONFIG;

    my $conf_filename = $ENV{JSAN_SITE_PREFIX} || '/var/www/';
    $conf_filename   .= $ENV{JSAN_SITE};
    $conf_filename   .= '/etc/jsan.cfg';

    open my $conf_file, "<", $conf_filename or die "Couldn't open file: [$conf_filename] $!"; 
    my $json = join("", <$conf_file>); 
    close $conf_file;
  
    return $CONFIG = bless {
        conf   => from_json($json),
        prefix => $ENV{JSAN_SITE},
    }, shift;
}

sub get {
    my ($self, $var) = @_;
    return $self->{conf}{site}{$self->{prefix}}{$var};
}

sub dbauth {
    my $self   = JSAN::Config->new;
    open AUTH, $self->get('dbauth') or die "Can't get DB Auth: $!\n";
    my @line = split ':', <AUTH>, 2;
    chomp @line;
    return { user => $line[0], pass => $line[1] };
}

1;

__END__
