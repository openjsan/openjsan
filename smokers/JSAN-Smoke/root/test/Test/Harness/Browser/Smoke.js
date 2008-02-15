// # $Id: Kinetic.pm 1493 2005-04-07 19:20:18Z theory $

if (typeof JSAN != 'undefined') new JSAN().use('Test.Harness.Browser');

Test.Harness.Browser.Smoke = function () {};
Test.Harness.Browser.Smoke.VERSION = '0.01';

Test.Harness.Browser.Smoke.runTests = function () {
    var harness = new Test.Harness.Browser.Smoke();
    harness.runTests.apply(harness, arguments);
};

Test.Harness.Browser.Smoke.prototype = new Test.Harness.Browser();

var old_outputSummary = Test.Harness.Browser.Smoke.prototype.outputSummary;
Test.Harness.Browser.Smoke.prototype.outputSummary = function () {
    old_outputSummary.apply( this, arguments );

    var form = document.createElement( 'form' );
    form.method = 'post';
    form.action = '/report';

    var input = document.createElement( 'input' );
    input.type = 'text';
    input.name = 'success';
    input.value = this._allOK() ? '1' : '0';

    form.appendChild( input );
    document.body.appendChild(form);

    if ( ! this._allOK() ) {
        var input2 = document.createElement( 'input' );
        input2.type = 'textarea';
        input2.name = 'failures';
        input2.value = document.getElementById( 'output' ).innerHTML;

        form.appendChild( input2 );
    }

    form.submit();
};

setTimeout( function () {
    var form = document.createElement( 'form' );
    form.method = 'post';
    form.action = '/report';

    var input = document.createElement( 'input' );
    input.type = 'text';
    input.name = 'success';
    input.value = '0';

    form.appendChild( input );

    var input2 = document.createElement( 'input' );
    input2.type = 'text';
    input2.name = 'failures';
    input2.value = "Stalled";

    form.appendChild( input2 );

    document.body.appendChild(form);

    form.submit();
}, 60 * 1000 );
