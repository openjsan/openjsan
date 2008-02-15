
// set up the namespace
if (HTML                == undefined) var HTML                = function () {};
if (HTML.Form           == undefined)     HTML.Form           = function () {};
if (HTML.Form.Validator == undefined)     HTML.Form.Validator = function () {};

HTML.Form.Validator.Element = function (name, error, error_handler) {
	this.name = name;
	this.error = error;
	this.error_handler = error_handler || function (error) { alert(error) };
}
HTML.Form.Validator.Element.VERSION = '0.01';

// methods
HTML.Form.Validator.Element.prototype.handleError = function (form_object) {
	this.error_handler(this.error);
	this.focusElement(form_object);
}

HTML.Form.Validator.Element.prototype.validate = function (form_object) {
	if (!this.test(form_object)){
		this.handleError(form_object);
		return false;
	}
	else{
		return true;
	}
}

// over-ride these methods as nessecary
HTML.Form.Validator.Element.prototype.getValue = function(form_object){
	return form_object.elements[this.name].value;
}	

HTML.Form.Validator.Element.prototype.focusElement = function(form_object){
	form_object.elements[this.name].focus();
}

HTML.Form.Validator.Element.prototype.test = function(form_object){
	return this.getValue(form_object);
}

/*

=pod

=head1 NAME

HTML.Form.Validator.Element - A framework for HTML Form Validation

=head1 SYNOPSIS

  // these will be added to a HTML.Form.Validator instance
  var first_name = new HTML.Form.Validator.Element('first_name', 'You must fill out a first name!');
  var last_name = new HTML.Form.Validator.Element('last_name', 'You must fill out a last name!');

=head1 DESCRIPTION

=head1 PROPERTIES

=over 4

=item B<name>

=item B<error>

=item B<error_handler>

=back

=head1 METHODS

=over 4

=item B<new HTML.Form.Validator.Element (name, error, error_handler)>

=item B<handleError (form_object)>

=item B<validate (form_object)>

=item B<test (form_object)>

=item B<getValue (form_object)>

=item B<focusElement (form_object)>

=back

=head1 AUTHOR

stevan little, E<lt>stevan@iinteractive.comE<gt>

=head1 COPYRIGHT AND LICENSE

Copyright 2005 by Infinity Interactive, Inc.

L<http://www.iinteractive.com>

This library is free software; you can redistribute it and/or modify
it under the same terms as Perl. 

=cut

*/

