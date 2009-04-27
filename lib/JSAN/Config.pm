package JSAN::Config;
use strict;
use warnings;

use AppConfig;

our $CONFIG;

sub new {
    return $CONFIG if $CONFIG;
    my $conf = AppConfig->new;
    $conf->define($_) for map {("live_$_", "dev_$_")} qw[
        db=s
        site=s
        jause=s
        dbauth=s
    ];
    $conf->define("file|filelist|f=s@");
    $conf->file(
          $ENV{JSAN_DEV}
        ? "/var/www/dev.openjsan.org/etc/jsan.cfg"
        :   -e "/var/www/master.openjsan.org/etc/jsan.cfg"
          ? "/var/www/master.openjsan.org/etc/jsan.cfg"
          : "/var/www/dev.openjsan.org/etc/jsan.cfg"
    );
    return $CONFIG = bless {
        conf   => $conf,
        prefix => ($ENV{JSAN_DEV} ? "dev" : "live"),
    }, shift;
}

sub get {
    my ($self, $var) = @_;
    my $pre = $self->{prefix};
    $var = "${pre}_$var";
    return $self->{conf}->$var;
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
