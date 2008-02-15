
// set up the namespace
if (HTML      == undefined) var HTML      = function () {};
if (HTML.Form == undefined)     HTML.Form = function () {};

HTML.Form.Validator = function (form_name, success_handler) {
	this.form_name = form_name;
	this.success_handler = success_handler || function (formObj) { formObj.submit };
	this.elements = [];	
}

HTML.Form.Validator.VERSION = '0.01';

HTML.Form.Validator.prototype.addElement = function (element) {
	this.elements[this.elements.length] = element;
}

HTML.Form.Validator.prototype.validate = function () {
	var form_object = document.forms[this.form_name];    
	for (var i = 0; i < this.elements.length; i++){
		if (!this.elements[i].validate(form_object)){
			return false;
		}
	}
	return this.success_handler(form_object);
}

/*

=pod

=head1 NAME

HTML.Form.Validator - A framework for HTML Form Validation

=head1 SYNOPSIS

  // inside an onSubmit handler
  var validator = new HTML.Form.Validator('my_form');
  validator.addElement(new HTML.Form.Validator.Element('my_element', 'This is my error message'));
  validator.addElement(new HTML.Form.Validator.Element('my_other_element', 'This is my other error message!'));
  validator.validate();

=head1 DESCRIPTION

=head1 PROPERTIES

=over 4

=item B<form_name>

=item B<elements>

=item B<success_handler>

=back

=head1 METHODS

=over 4

=item B<new HTML.Form.Validator (form_name, success_handler)>

=item B<addElement (element)>

=item B<validate ()>

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