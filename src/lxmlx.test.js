import {
    fromString,
    toString,
    scan,
    unscan,
    withPeer,
    textOf,
} from './lxmlx.js';

test('fromString/toString', () => {
    const xml = fromString('<a>Hello</a>');
    const xmltext = toString(xml)
    expect(xmltext).toBe('<a>Hello</a>');
});

test('fromString/toString (with namespace)', () => {
    const xml = fromString('<ns:a xmlns:ns="huh">Hello</ns:a>');
    const xmltext = toString(xml)
    expect(xmltext).toBe('<ns:a xmlns:ns="huh">Hello</ns:a>');
});

test('fromString/toString (with XML declaration)', () => {
    const xml = fromString('<a>Hello</a>');
    const xmltext = toString(xml, {xmlDeclaration: true})
    expect(xmltext).toBe("<?xml version='1.0' encoding='utf-8'?>\n<a>Hello</a>");
});

test('scan', () => {
    const xml = fromString('<a>Hello</a>');
    const events = [...scan(xml)];
    expect(events).toStrictEqual([
        {type: 'enter', tag: 'a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'exit'},
    ]);
});

test('scan (with namespace)', () => {
    const xml = fromString('<ns:a xmlns:ns="huh">Hello</ns:a>');
    const events = [...scan(xml)];
    expect(events).toStrictEqual([
        {type: 'enter', tag: '{huh}a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'exit'},
    ]);
});

test('scan (PI)', () => {
    const xml = fromString('<a>Hello<?pi ?>, world</a>');
    const events = [...scan(xml)];
    expect(events).toStrictEqual([
        {type: 'enter', tag: 'a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'pi', text: '', 'target': 'pi'},
        {type: 'text', text: ', world'},
        {type: 'exit'},
    ]);
});

test('scan (comment)', () => {
    const xml = fromString('<a>Hello<!-- This is a comment -->, world</a>');
    const events = [...scan(xml)];
    expect(events).toStrictEqual([
        {type: 'enter', tag: 'a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'comment', text: ' This is a comment '},
        {type: 'text', text: ', world'},
        {type: 'exit'},
    ]);
});

test('unscan', () => {
    const xml = unscan([
        {type: 'enter', tag: 'a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'exit'},
    ]);
    const xmltext = toString(xml)
    expect(xmltext).toBe('<a>Hello</a>');
});

test('unscan (with namespace)', () => {
    const xml = unscan([
        {type: 'enter', tag: '{boo}a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'exit'},
    ], {
        nsmap: {
            "ns": "boo"
        }
    });
    const xmltext = toString(xml)
    expect(xmltext).toBe('<ns:a xmlns:ns="boo">Hello</ns:a>');
});

test('unscan (PI)', () => {
    const xml = unscan([
        {type: 'enter', tag: 'a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'pi', target: 'pi', text: 'content'},
        {type: 'text', text: ' world!'},
        {type: 'exit'},
    ]);
    const xmltext = toString(xml)
    expect(xmltext).toBe('<a>Hello<?pi content?> world!</a>');
});

test('unscan (comment)', () => {
    const xml = unscan([
        {type: 'enter', tag: 'a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'comment', text: 'content'},
        {type: 'text', text: ' world!'},
        {type: 'exit'},
    ]);
    const xmltext = toString(xml)
    expect(xmltext).toBe('<a>Hello<!--content--> world!</a>');
});

test('withPeer', () => {
    const result = [...withPeer([
        {type: 'enter', tag: 'a', attrib: {}},
        {type: 'text', text: 'Hello'},
        {type: 'comment', text: 'content'},
        {type: 'text', text: ' world!'},
        {type: 'exit'},
    ])];
    expect(result).toStrictEqual([
        [{type: 'enter', tag: 'a', attrib: {}}, undefined],
        [{type: 'text', text: 'Hello'}, undefined],
        [{type: 'comment', text: 'content'}, undefined],
        [{type: 'text', text: ' world!'}, undefined],
        [{type: 'exit'}, {type: 'enter', tag: 'a', attrib: {}}],
    ])
});


test('textOf', () => {
    const xml = fromString('<a>Hello<!-- This is a comment -->, world</a>');
    const text = textOf(scan(xml));

    expect(text).toBe('Hello, world');
});