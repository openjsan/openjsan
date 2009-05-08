package JSAN::Server;
# $Id: $
use strict;  
use warnings;
use JSAN::Data;
use JSAN::Config;

use base qw[Class::Accessor::Fast];
use Digest::MD5 qw[md5_hex];
use IO::All;
use Email::Address;
use Email::Send;
use File::Basename;
use String::MkPasswd qw(mkpasswd);


__PACKAGE__->mk_accessors(qw[data client_ip incoming config]);
sub new {
    my ($class, %args) = @_;
    my $self = $class->SUPER::new(\%args);
    $self->data(JSAN::Data->new);
    $self->config(JSAN::Config->new);
    $self->incoming($self->config->get('site') . '/incoming') unless $self->incoming;
    return $self;
}

sub account_create {
    my ($self, $args) = @_;

    return { error => "Author exists" }
      if    $self->data->author->search(login => $args->{login})->count
         || $self->data->author->search(email => $args->{email})->count;

    return { error => "Passwords don't match" }
      if $args->{pass} ne $args->{pass2};

    return { error => "Login can only contain alphanumeric characters" }
      unless $args->{login} =~ /^\w+$/;

    return { error => "Email must a valid address" }
      unless scalar(Email::Address->parse($args->{email})) == 1;

    my $author = $self->data->author->create({
        login    => lc($args->{login}),
        name     => $args->{name},
        pass     => md5_hex($args->{pass}),
        email    => $args->{email},
        url      => $args->{url},
        approved => 1,
    });

    return { created => ($author ? 1 : undef) };
}

sub user_info {
    my ($self, $args) = @_;
    my $user = $self->data->author->retrieve($args->{id});
    return { error => "No such user" } unless $user;
    
    return {
        account => {
            login => $user->login,
            name  => $user->name,
            email => $user->email,
            url   => $user->url,
        },
    };
}

sub login {
    my ($self, $args) = @_;

    my $seed = $self->get_seed;
    my $user = $self->data->author->search(login => $args->{login})->first;

    return { error => "Login incorrect" } unless $user && $seed;
    return { error => "Login incorrect" } unless md5_hex($args->{pass}) eq $user->pass;

    $seed->author($user);
    $seed->update;

    return { seed => $seed->seed, id => $user->id };
}

sub password_recover {
    my ($self, $args) = @_;

    my $user = $self->data->author->search(login => $args->{login}, email => $args->{email})->first;

    return { error => "No such user or email" } unless $user;

    my $temp_pass = mkpasswd( -length => 13, );

    my $message = <<"__MESSAGE__";
To: $args->{email}
From: admin\@openjsan.org
Subject: OpenJSAN Author Login

Recently you requested to have your password reset.

Your password has been changed to: $temp_pass

Please change this as soon as possible.

Thanks for your support.

__MESSAGE__

    $message .= 'Login: ' . $self->config->get('jause') . "\n";

    my $sender = Email::Send->new({mailer => 'Sendmail'});
    #$sender->mailer_args([Host => 'localhost']);
    $sender->send($message);

    $user->pass(md5_hex($temp_pass));
    $user->update;

    return { };
}

sub password_change {
    my ($self, $args) = @_;

    return { error => "Not logged in" } unless $args->{seed};
    my $seed = $self->data->seed->search(seed => $args->{seed})->first;
    return { error => "Not logged in" } unless $seed;
    my $user = $seed->author;
    return { error => "No such user" } unless $user;

    return { error => "Passwords don't match" }
      if $args->{pass} ne $args->{pass2};

    $user->pass(md5_hex($args->{pass}));
    $user->update;

    return { };
}

sub get_seed {
    my ($self, %args) = @_;
    my $seed = $self->data->seed->create({});
    return $seed;
}

sub upload_dist {
    my ($self, $args) = @_;

    return { error => "Not logged in" } unless $args->{seed};
    my $seed = $self->data->seed->search(seed => $args->{seed})->first;
    return { error => "Not logged in" } unless $seed;
    my $user = $seed->author;
    return { error => "No such user" } unless $user;

    my $incoming = $self->incoming;
    foreach my $file ( @{$args->{files}} ) {
        my $filename = "$file->{filename}";
        $filename = (split /\\/, $filename)[-1] if $filename =~ m[\\];
        my $name = join '/', $incoming, $filename;
        my $fh = $file->{filename};
        my $out = io($name);
        $out->print($_) while <$fh>;
        $user->add_to_distributions({filename => $filename});
    }
    return { uploaded => 1 };
}

1;

__END__
