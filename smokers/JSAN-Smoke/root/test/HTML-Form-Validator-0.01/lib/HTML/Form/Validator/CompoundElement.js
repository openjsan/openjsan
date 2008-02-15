
// set up the namespace
if (HTML                == undefined) var HTML                = function () {};
if (HTML.Form           == undefined)     HTML.Form           = function () {};
if (HTML.Form.Validator == undefined)     HTML.Form.Validator = function () {};

HTML.Form.Validator.CompoundElement = function (error, error_handler) {
	this.elements = [];
	this.error = error;
	this.error_handler = error_handler || function (error) { alert(error) };	
}
HTML.Form.Validator.CompoundElement.VERSION = '0.01';

// methods
HTML.Form.Validator.CompoundElement.prototype.handleError = function (form_object) {
	this.error_handler(this.error);
	this.focusElement(form_object);
}

HTML.Form.Validator.CompoundElement.prototype.validate = function (form_object) {
	if (!this.test(form_object)){
		this.handleError(form_object);
		return false;
	}
	else{
		return true;
	}
}

HTML.Form.Validator.CompoundElement.prototype.addElement = function(element){
	this.elements[this.elements.length] = element;
}

// overide this method as nessecary
HTML.Form.Validator.CompoundElement.prototype.test = function(form_object){
	for (var i = 0; i < this.elements.length; i++){
		if (!this.elements[i].validate(form_object)){
			return false;
		}
	}
	return true;
}

HTML.Form.Validator.CompoundElement.prototype.focusElement = function(form_object){
	form_object.elements[this.elements[0].name].focus();
}	

/*

=pod

=head1 NAME

HTML.Form.Validator.CompoundElement - A framework for HTML Form Validation

=head1 SYNOPSIS

=head1 DESCRIPTION

=head1 PROPERTIES

=over 4

=item B<elements>

=item B<error>

=item B<error_handler>

=back

=head1 METHODS

=over 4

=item B<new HTML.Form.Validator.CompoundElement (error, error_handler)>

=item B<addElement (element)>

=item B<handleError (form_object)>

=item B<validate (form_object)>

=item B<test (form_object)>

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
