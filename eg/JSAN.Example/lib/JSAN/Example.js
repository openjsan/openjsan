// Set up namepace
if (!JSAN) var JSAN = {};

JSAN.Example = function () {
    // Constructor. It is usually good to reset class data members here.
    // If this code is to be used only for a functional interface this
    //   could simply be an object assignment: JSAN.Example = {};
}

// Exporter System for JSAN
JSAN.Example.EXPORT = [ 'functionOne', 'functionTwo' ];

// Fully-Qualified Function Declarations
JSAN.Example.functionOne = function (list) {

}

JSAN.Example.functionTwo = function () {

}

// Fully-Qualified Properties
JSAN.Example.DEBUG = 1;

// Class Prototype. Put class methods and data members in here.
JSAN.Example.prototype = {

    // Private Property
    _privateProperty: null,
    
    // Public Property
    publicProperty: [],


    // Private Methods
    _onlyForMe: function (format, str) {
        // Should only be called within this class using 'this'.
    },
    
    // Public Methods
    useMeHere: function () {
        // May be called on an instance of this class.
    }
};

/*

=head1 NAME

JSAN.Example - Example Library for the JavaScript Archive Network

=head1 SYNOPSIS

  // Functional Example
  JSAN.Example.functionOne([
      'do', 'stuff', 'with',
      'this', 'example'
  ]);

  // Class Example
  var ex = new JSAN.Example;
  ex.useMeHere();


  // JSAN Example
  var jsan = new JSAN;
  jsan.use('JSAN.Example');
  
  var ex = new JSAN.Example;
  ex.useMeHere();

=head1 DESCRIPTION

This library is really lame. Please update the docs.

=head2 Constructor

  var ex = new JSAN.Example();

Create a new C<JSAN.Example> object.

=head2 Class Properties

=head3 DEBUG

  JSAN.Example.DEBUG = 11; // This one goes...

blah blah

=head2 Methods

=head3 useMeHere()

  ex.useMeHere();

blah blah

=head2 EXPORTS

When used with C<JSAN> this will export C<functionOne> and C<functionTwo>
by default.

=head1 SEE ALSO

C<JSAN>

=head1 AUTHOR

A. Thor <F<user@example.com>>

=head1 COPYRIGHT

  Copyright (c) 2005 A. Thor.  All rights reserved.
  This module is free software; you can redistribute it and/or modify it
  under the terms of the Artistic license. Or whatever license I choose,
  which I will do instead of keeping this documentation like it is.

=cut


*/
