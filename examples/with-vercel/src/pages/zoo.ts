import { task } from '@stackpress/ingest';

export default task(function hello(req, res, ctx) {
  console.log('zoo zoo zoo');
  const bar = res.data.get('bar');
  res.data.set({ 'foo': bar });
  res.code = 200;
  res.status = 'OK';
});