import { task } from '@stackpress/ingest';

export default task(function hello(req, res) {
  console.log('zoo zoo zoo');
  res.code = 200;
  res.status = 'OK';
  if (res.type === 'object') {
    const body = res.body as Record<string, unknown>;
    res.body = { ...body, age: 30 };
  }
});