import test from "ava";
import {
    fromString,
    toString,
    scan,
    unscan,
    withPeer,
    textOf,
} from './lxmlx.js';


test('fromString/toString', t => {
    const xml = fromString('<a>Hello</a>');
    const xmltext = toString(xml);
    t.is(xmltext, '<a>Hello</a>');
});

test('fromString/toString (with namespace)', t => {
    const xml = fromString('<ns:a xmlns:ns="huh">Hello</ns:a>');
    const xmltext = toString(xml);
    t.is(xmltext, '<ns:a xmlns:ns="huh">Hello</ns:a>');
});

test('fromString/toString (with XML declaration)', t => {
    const xml = fromString('<a>Hello</a>');
    const xmltext = toString(xml, {xmlDeclaration: true});
    t.is(xmltext, "<?xml version='1.0' encoding='utf-8'?>\n<a>Hello</a>");
});

test('scan', t => {
    const xml = fromString('<a>Hello</a>');
    const events = [...scan(xml)];
    t.deepEqual(events, [
        {type: 'enter', tag: 'a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'exit'},
    ]);
});

test('scan (with namespace)', t => {
    const xml = fromString('<ns:a xmlns:ns="huh">Hello</ns:a>');
    const events = [...scan(xml)];
    t.deepEqual(events, [
        {type: 'enter', tag: '{huh}a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'exit'},
    ]);
});

test('scan (PI)', t => {
    const xml = fromString('<a>Hello<?pi ?>, world</a>');
    const events = [...scan(xml)];
    t.deepEqual(events, [
        {type: 'enter', tag: 'a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'pi', text: '', 'target': 'pi'},
        {type: 'text', text: ', world'},
        {type: 'exit'},
    ]);
});

test('scan (comment)', t => {
    const xml = fromString('<a>Hello<!-- This is a comment -->, world</a>');
    const events = [...scan(xml)];
    t.deepEqual(events, [
        {type: 'enter', tag: 'a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'comment', text: ' This is a comment '},
        {type: 'text', text: ', world'},
        {type: 'exit'},
    ]);
});

test('unscan', t => {
    const xml = unscan([
        {type: 'enter', tag: 'a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'exit'},
    ]);
    const xmltext = toString(xml);
    t.is(xmltext, '<a>Hello</a>');
});

test('unscan (with namespace)', t => {
    const xml = unscan([
        {type: 'enter', tag: '{boo}a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'exit'},
    ], {
        nsmap: {
            "ns": "boo"
        }
    });
    const xmltext = toString(xml);
    t.is(xmltext, '<ns:a xmlns:ns="boo">Hello</ns:a>');
});

test('unscan (PI)', t => {
    const xml = unscan([
        {type: 'enter', tag: 'a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'pi', target: 'pi', text: 'content'},
        {type: 'text', text: ' world!'},
        {type: 'exit'},
    ]);
    const xmltext = toString(xml);
    t.is(xmltext, '<a>Hello<?pi content?> world!</a>');
});

test('unscan (comment)', t => {
    const xml = unscan([
        {type: 'enter', tag: 'a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'comment', text: 'content'},
        {type: 'text', text: ' world!'},
        {type: 'exit'},
    ]);
    const xmltext = toString(xml);
    t.is(xmltext, '<a>Hello<!--content--> world!</a>');
});

test('withPeer', t => {
    const result = [...withPeer([
        {type: 'enter', tag: 'a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'comment', text: 'content'},
        {type: 'text', text: ' world!'},
        {type: 'exit'},
    ])];
    t.deepEqual(result, [
        [{type: 'enter', tag: 'a', attrib: {}}, undefined],
        [{type: 'text', text: 'Hello'}, undefined],
        [{type: 'comment', text: 'content'}, undefined],
        [{type: 'text', text: ' world!'}, undefined],
        [{type: 'exit'}, {type: 'enter', tag: 'a', attrib: {}}],
    ]);
});


test('textOf', t => {
    const xml = fromString('<a>Hello<!-- This is a comment -->, world</a>');
    const text = textOf(scan(xml));

    t.is(text, 'Hello, world');
});