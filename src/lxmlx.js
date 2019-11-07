export const ENTER = 'enter';
export const EXIT  = 'exit';
export const TEXT  = 'text';
export const PI    = 'pi';
export const COMMENT = 'comment';

var _document = document;
var _parser = new DOMParser();
var _serializer = new XMLSerializer();

export function fromString(text) {
    if (!text) {
        return undefined;
    }
    const xml = _parser.parseFromString(text, 'application/xml').documentElement;
    if (xml.nodeName === 'parsererror') {
        throw new Error('Error parsing text');
    }
    return xml;
}

export function toString(xml, options) {
    options = Object.assign({}, options);
    let xmltext = _serializer.serializeToString(xml);
    if (options.xmlDeclaration) {
        xmltext = "<?xml version='1.0' encoding='utf-8'?>\n" + xmltext;
    }
    return xmltext;
}

export function* scan(xml) {
    yield {
        type: ENTER,
        tag: curlyName(xml.namespaceURI, xml.nodeName),
        attrib: attrib(xml),
    }

    for (const c of xml.childNodes) {
        if (c.nodeType === 3) {
            yield {
                type: TEXT,
                text: c.textContent,
            }
        } else if (c.nodeType === 1) {
            yield* scan(c);
        } else if (c.nodeType === 7) {
            yield {
                type: PI,
                target: c.target,
                text: c.data,
            }
        } else if (c.nodeType === 8) {
            yield {
                type: COMMENT,
                text: c.data,
            }
        }
    }

    yield {
        type: EXIT,
    }
}

export function unscan(events, options) {
    options = Object.assign({}, options);
    const qualifier = new Qualifier(options.nsmap);
    const stack = [];
    var root;
    for (const e of events) {
        if (e.type == ENTER) {
            const elt = createElement(e.tag, e.attrib, stack[stack.length-1], qualifier);
            stack.push(elt);
            if (root === undefined) {
                root = elt;
            }
        } else if (e.type == EXIT) {
            stack.pop();
        } else if (e.type == TEXT) {
            stack[stack.length - 1].appendChild(_document.createTextNode(e.text));
        } else if (e.type == PI) {
            stack[stack.length - 1].appendChild(_document.createProcessingInstruction(e.target, e.text));
        } else if (e.type == COMMENT) {
            stack[stack.length - 1].appendChild(_document.createComment(e.text));
        } else {
            throw new Error('Unexpected event type ' + e.type);
        }
    }

    if (stack.length !== 0) {
        throw new Error('unbalanced tags in stream');
    }

    return root;
}

class Qualifier {
    constructor(nsmap) {
        this._id = 0;
        nsmap = Object.assign({}, nsmap);
        this._nsindex = {}
        for (const [key, value] of Object.entries(nsmap)) {
            this._nsindex[value] = key;
        }
    }

    qualify(namespaceURI, name) {
        if (!namespaceURI) {
            return name;  // nothing to qualify
        }
        var prefix = this._nsindex[namespaceURI];
        if (prefix === undefined) {
            prefix = 'ns' + this._id;
            this._nsindex[namespaceURI] = prefix;
            this._id += 1;
        } else if (prefix == 'default' || prefix === null || prefix === '') {
            return name;
        }
        return prefix + ':' + name;
    }
}

function curlyName(namespaceURI, name) {
    if (namespaceURI) {
        const parts = name.split(':');
        return '{' + namespaceURI + '}' + parts[parts.length - 1];
    } else {
        return name;
    }
}

function parseCurlyName(name) {
    const match = name.match(/^{(.+)}(.+)$/)
    if (match) {
        return {
            namespaceURI: match[1],
            nodeName: match[2]
        };
    } else {
        return {
            nodeName: name
        };
    }
}

function createElement(tag, attrib, parent, qualifier) {
    const { namespaceURI, nodeName } = parseCurlyName(tag);
    const elt = _document.createElementNS(namespaceURI, qualifier.qualify(namespaceURI, nodeName));

    if (parent) {
        parent.append(elt);
    }

    for (const name of Object.keys(Object.assign({}, attrib))) {
        const { namespaceURI, nodeName } = parseCurlyName(name);
        const attr = _document.createAttributeNS(namespaceURI, qualifier.qualify(namespaceURI, nodeName));
        if (attrib[name] !== undefined) {
            attr.value = attrib[name];
            elt.setAttributeNode(attr);
        }
    }

    return elt;
}

function attrib(elt) {
    const out = {}
    for (var i = 0; i < elt.attributes.length; i++) {
        const attr = elt.attributes[i];
        if (attr.name === 'xmlns' || attr.name.startsWith('xmlns:')) {
            continue;
        }
        const name = curlyName(attr.namespaceURI, attr.name);
        out[name] = attr.value;
    }
    return out;
}

export function* withPeer(events) {
    const stack = [];
    for (const e of events) {
        if (e.type == ENTER) {
            stack.push(e);
            yield [e, undefined];
        } else if (e.type === EXIT) {
            yield [e, stack.pop()];
        } else if (e.type === TEXT) {
            yield [e, undefined];
        } else if (e.type === PI) {
            yield [e, undefined];
        } else if (e.type === COMMENT) {
            yield [e, undefined];
        } else {
            throw new Error('Unexpected event ' + e);
        }
    }
}
