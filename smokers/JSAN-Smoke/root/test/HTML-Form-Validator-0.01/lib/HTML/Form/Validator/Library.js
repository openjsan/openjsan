
///////////////////////////////////////////////////////////////////////////////
// Password Confirmation Validator

function PasswordConfirmationValidator (error, elements) {
	this.elements = elements || [];
	this.error = error;
}

PasswordConfirmationValidator.prototype.test = function(formObject){
	var new_password = this.elements[0].getValue(formObject);
	var new_password_confirm = this.elements[1].getValue(formObject);
	if (new_password == new_password_confirm) {
		return true;
	}
	else {
		return false;
	}
}

PasswordConfirmationValidator.prototype = new HTML.Form.Validator.CompoundElement();

///////////////////////////////////////////////////////////////////////////////
// Radio Button Group Validator

function RadioButtonGroupValidator (name, error) {
	this.name = name;
	this.error = error;
}

RadioButtonGroupValidator.prototype.getValue = function (formObject) {
	var radioGroup = formObject.elements[this.name];
	for (radioGroupLoop = 0; radioGroupLoop < radioGroup.length; radioGroupLoop++){
		if (radioGroup[radioGroupLoop].checked){
			return true;
		}
	}
	return false;
}	

RadioButtonGroupValidator.prototype.focusElement = function (formObject) {
	formObject.elements[this.name][0].focus();
}

RadioButtonGroupValidator.prototype = new HTML.Form.Validator.Element();

///////////////////////////////////////////////////////////////////////////////
// Check Box Validator

function CheckBoxValidator(name, error){
	this.name = name;
	this.error = error;
}

CheckBoxValidator.prototype.getValue = function(formObject){
	return formObject.elements[this.name].checked;
}

CheckBoxValidator.prototype = new HTML.Form.Validator.Element();

///////////////////////////////////////////////////////////////////////////////
// Select Box Validator

function SelectBoxValidator(name, error){
	this.name = name;
	this.error = error;
}

SelectBoxValidator.prototype.getValue = function(formObject){
	var selectBox = formObject.elements[this.name];
	return selectBox.options[selectBox.selectedIndex].value;
}

SelectBoxValidator.prototype = new HTML.Form.Validator.Element();

///////////////////////////////////////////////////////////////////////////////
// Text Field Validator

function TextFieldValidator(name, error){
	this.name = name;
	this.error = error;
}

TextFieldValidator.prototype = new HTML.Form.Validator.Element();

///////////////////////////////////////////////////////////////////////////////
// Bounded Length Text Field Validator

function BoundedLengthTextFieldValidator(name, minimumLength, maximumLength, error){
	this.name = name;
	this.minimumLength = minimumLength;
	this.maximumLength = maximumLength;
	this.error = error;
}

BoundedLengthTextFieldValidator.prototype.test = function(formObject){
	fieldValueLength = this.getValue(formObject).length;
	return (fieldValueLength >= this.minimumLength && fieldValueLength <= this.maximumLength);
}

BoundedLengthTextFieldValidator.prototype = new TextFieldValidator();

///////////////////////////////////////////////////////////////////////////////
// Email field Validator

function EmailFieldValidator(name, error){
	this.name = name;
	this.error = error;
}

EmailFieldValidator.prototype.test = function(formObject){
	var fieldValue = this.getValue(formObject);
	var atSymbolPos = fieldValue.indexOf('@');
	return (atSymbolPos != -1 && fieldValue.lastIndexOf('.') > atSymbolPos);
}

EmailFieldValidator.prototype = new TextFieldValidator()

///////////////////////////////////////////////////////////////////////////////
// Numeric field Validator

function NumericFieldValidator(name, error){
	this.name = name;
	this.error = error;
}

// -----------------------------------------
// checkNumericString Method
// -----------------------------------------
// this method checks that the string in
// questions is truely a wholly numeric 
// string. This method is neccesary because
// the built in javascript parseInt() function
// with will parse out an integer as long
// the first digit is a number.
//
// example:
// parseInt("2a") will return 2 instead of NaN
// -----------------------------------------
// NOTE: 
// this method does NOT perform any type 
// conversion on the string passed to it.
// You must convert the string explicitly.
// -----------------------------------------
NumericFieldValidator.prototype.checkNumericString = function(stringToTest){
	// a numeric string cannot be empty
	if (stringToTest == ''){
		return false;
	}
	for (numCheckLoop = 0; numCheckLoop < stringToTest.length; numCheckLoop++){
		if (isNaN(parseInt(stringToTest.charAt(numCheckLoop)))){
			return false;
		}
	}
	return true;
}

this.test = function(formObject){
	return this.checkNumericString(this.getValue(formObject));
}

NumericFieldValidator.prototype = new TextFieldValidator();

///////////////////////////////////////////////////////////////////////////////
// Non Numeric field Validator

function NonNumericFieldValidator(name, error){
	this.name = name;
	this.error = error;
}

NonNumericFieldValidator.prototype.test = function(formObject){
	return !this.checkNumericString(this.getValue(formObject));
}

NonNumericFieldValidator.prototype = new NumericFieldValidator();

///////////////////////////////////////////////////////////////////////////////
// Bounded Length Numeric field Validator

function BoundedLengthNumericFieldValidator(name, minimumLength, maximumLength, error){
	this.name = name;
	this.minimumLength = minimumLength;
	this.maximumLength = maximumLength;
	this.error = error;
}

BoundedLengthNumericFieldValidator.prototype.test = function(formObject){
	fieldValue = this.getValue(formObject);
	if (!this.checkNumericString(fieldValue)){
		return false;
	}
	fieldValueLength = fieldValue.length;
	return (fieldValueLength >= this.minimumLength && fieldValueLength <= this.maximumLength);
}

BoundedLengthNumericFieldValidator.prototype = new NumericFieldValidator();

///////////////////////////////////////////////////////////////////////////////
// Bounded Numeric field Validator

function BoundedNumericFieldValidator(name, minimum, maximum, error){
	this.name = name;
	this.minimum = minimum;
	this.maximum = maximum;
	this.error = error;
}

BoundedNumericFieldValidator.prototype.test = function(formObject){
	fieldValue = this.getValue(formObject);
	if (!this.checkNumericString(fieldValue)){
		return false;
	}
	fieldValue = parseInt(fieldValue);
	return (fieldValue >= this.minimum && fieldValue <= this.maximum);
}

BoundedNumericFieldValidator.prototype = new NumericFieldValidator();

///////////////////////////////////////////////////////////////////////////////
// Date field Validator
//-----------------------------------------------
// checks the following format :
//      mm/dd/yyyyy
// and verifies that the date is valid by
// using the built in Javascript Date Object.

function DateFieldValidator(name, error){
	this.name = name
	this.error = error;

	// private fields used for internal date reprentation.
	this.day;
	this.month;
	this.year;
}

DateFieldValidator.prototype.parseDateString = function(fieldValue){
	// find string indeces of delimeters
	var delimeter_1 = fieldValue.indexOf('/');
	var delimeter_2 = fieldValue.lastIndexOf('/');
	// verify that both delimters exist
	if (delimeter_1 == -1 || delimeter_2 == -1){
		// otherwise parsing failed...
		return false;
	}
	// extract date strings
	this.month = fieldValue.substring(0, delimeter_1);
	this.day = fieldValue.substring((delimeter_1 + 1), delimeter_2);
	this.year = fieldValue.substring((delimeter_2 + 1));
	// check to make sure we have a 4-digit year
	// (and that the first digit is not a zero otherwise javascript chokes on it)
	if (this.year.length != 4 || this.year.charAt(0) == '0'){
		// otherwise parsing failed...
		return false;
	}
	// verify that the date strings are
	// completely numeric (see method documentation)
	if (!this.checkNumericString(this.month) || !this.checkNumericString(this.year) || !this.checkNumericString(this.day)){
		// otherwise parsing failed...
		return false;
	}
	// date parsed successfully.
	return true;
}

DateFieldValidator.prototype.checkDate = function(){
	// convert string values to integers
	this.day = parseInt(this.day);
	this.month = parseInt(this.month);
	this.year = parseInt(this.year);
	// decrement month for 0 indexed month array
	this.month--;
	// load date into Javascript Date Object
	var tempDate = new Date();
	tempDate.setDate(this.day);
	tempDate.setMonth(this.month);
	tempDate.setYear(this.year);
	// checks to see if the date is valid
	// by checking the original values against 
	// the values returned by the Javascript Date
	// Object. This is utilizes the fact that the 
	// Date object will perform a date "rollover" 
	// if the value is "out of range".
	//
	// example:
	// 2/31/2001   (original - representing Feb. 31, 2001 and invalid date)
	// the Javascript Date Object will convert it to...
	// March 3, 2001 
	// the same thing will happen with a year value
	// 13/2/2001 will come be converted to 1/2/2002
	if (tempDate.getDate() != this.day || tempDate.getMonth() != this.month || tempDate.getFullYear() != this.year){
		// otherwise the date is invalid...
		return false;
	}
	// the date is valid.
	return true;
}

DateFieldValidator.prototype.test = function(formObject){
	fieldValue = this.getValue(formObject);
	// parse the date and test that
	// the date parsed successfully
	if (!this.parseDateString(fieldValue)){
		// otherwise the date is invalid...
		return false;
	}
	return this.checkDate();
}

DateFieldValidator.prototype = new NumericFieldValidator();

///////////////////////////////////////////////////////////////////////////////


/*

=pod

=head1 NAME

HTML.Form.Validator.Library - A library of HTML.Form.Validator.Element classes

=head1 DESCRIPTION

=head1 VALIDATOR ELEMENTS

=over 4

=item PasswordConfirmationValidator I<CompoundFormElementValidator> 

takes 2 TextFieldValidator elements and compares their values to make 
sure they match.

=item RadioButtonGroupValidator I<FormElementValidator>

takes a Radio Group and assures that one has been chosen

=item CheckBoxValidator I<FormElementValidator>

confirms that the checkbox is checked

=item SelectBoxValidator I<FormElementValidator>

makes sure the element chosen has a valid value (not 0 or "")

=item TextFieldValidator I<FormElementValidator>

makes sure the text field element has a valid value (not 0 or "")

=item BoundedLengthTextFieldValidator I<TextFieldValidator>

assures that the length of the Text field in question fits within a min 
and max value specified in the constructor arguments

=item EmailFieldValidator I<TextFieldValidator>

assures that the value within the text field is an email address. Tests 
first forthe presence of the "@" character, then for at least 1 "." 
after that.

=item NumericFieldValidator I<TextFieldValidator>

assures that the all of the characters in the text field are numeric

=item NonNumericFieldValidator I<NumericFieldValidator>

assures that there are no numbers in the text field

=item BoundedLengthNumericFieldValidator I<NumericFieldValidator>

assures that the numeric text field has between a min and max amount 
of number in it

=item BoundedNumericFieldValidator I<NumericFieldValidator>

assures that the numeric text field value is between a min and 
max amount

=item DateFieldValidator I<NumericFieldValidator>

parses and checks dates in the following format mm/dd/yyyy. It 
even checks to see that they date is a valid date.

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

