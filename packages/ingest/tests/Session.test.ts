import { ReadSession, WriteSession, session } from '../src/Session';
import { expect } from 'chai';

describe('ReadSession', () => {
  let readSession: ReadSession;

  beforeEach(() => {
    readSession = new ReadSession([
      ['name', 'test'],
      ['array', ['item1', 'item2']]
    ]);
  });

  it('should get data as object', () => {
    expect(readSession.data).to.deep.equal({
      name: 'test',
      array: ['item1', 'item2']
    });
  });

  it('should get values correctly', () => {
    expect(readSession.get('name')).to.equal('test');
    expect(readSession.get('array')).to.deep.equal(['item1', 'item2']);
    expect(readSession.get('nonexistent')).to.be.undefined;
  });
});

describe('WriteSession', () => {
  let writeSession: WriteSession;

  beforeEach(() => {
    writeSession = new WriteSession([
      ['name', 'test'],
      ['array', ['item1', 'item2']]
    ]);
  });

  it('should clear all entries', () => {
    writeSession.clear();
    expect(writeSession.size).to.equal(0);
    expect(Array.from(writeSession.revisions.entries())).to.deep.equal([
      ['name', { action: 'remove' }],
      ['array', { action: 'remove' }]
    ]);
  });

  it('should delete specific entry', () => {
    writeSession.delete('name');
    expect(writeSession.has('name')).to.be.false;
    expect(writeSession.revisions.get('name')).to.deep.equal({ action: 'remove' });
  });

  it('should set new values', () => {
    writeSession.set('newKey', 'newValue');
    writeSession.set('newArray', ['item3', 'item4']);

    expect(writeSession.get('newKey')).to.equal('newValue');
    expect(writeSession.get('newArray')).to.deep.equal(['item3', 'item4']);
    expect(writeSession.revisions.get('newKey')).to.deep.equal({ 
      action: 'set', 
      value: 'newValue' 
    });
    expect(writeSession.revisions.get('newArray')).to.deep.equal({ 
      action: 'set', 
      value: ['item3', 'item4'] 
    });
  });
});

describe('session function', () => {
  let sessionInstance: ReturnType<typeof session>;

  beforeEach(() => {
    sessionInstance = session([
      ['name', 'test'],
      ['array', ['item1', 'item2']]
    ]);
  });

  it('should work as a callable function', () => {
    expect(sessionInstance('name')).to.equal('test');
    expect(sessionInstance('array')).to.deep.equal(['item1', 'item2']);
    expect(sessionInstance('nonexistent')).to.be.undefined;
  });

  it('should expose session methods', () => {
    sessionInstance.set('newKey', 'newValue');
    expect(sessionInstance.get('newKey')).to.equal('newValue');

    sessionInstance.delete('newKey');
    expect(sessionInstance.has('newKey')).to.be.false;

    expect(sessionInstance.size).to.equal(2);
    expect(sessionInstance.data).to.deep.equal({
      name: 'test',
      array: ['item1', 'item2']
    });
  });

  it('should track revisions', () => {
    sessionInstance.set('key1', 'value1');
    sessionInstance.delete('name');
    
    expect(Array.from(sessionInstance.revisions.entries())).to.deep.equal([
      ['key1', { action: 'set', value: 'value1' }],
      ['name', { action: 'remove' }]
    ]);
  });

  it('should support iteration methods', () => {
    const entries = Array.from(sessionInstance.entries());
    expect(entries).to.deep.equal([
      ['name', 'test'],
      ['array', ['item1', 'item2']]
    ]);

    const keys = Array.from(sessionInstance.keys());
    expect(keys).to.deep.equal(['name', 'array']);

    const values = Array.from(sessionInstance.values());
    expect(values).to.deep.equal(['test', ['item1', 'item2']]);

    const forEachResult: Array<[string, string | string[]]> = [];
    sessionInstance.forEach((value, key) => {
      forEachResult.push([key, value]);
    });
    expect(forEachResult).to.deep.equal([
      ['name', 'test'],
      ['array', ['item1', 'item2']]
    ]);
  });
});
