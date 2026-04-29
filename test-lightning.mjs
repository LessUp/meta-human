import { transform } from 'lightningcss';
const res = transform({
  code: Buffer.from('.a { margin-inline: auto; }'),
  targets: { chrome: 60 << 16 },
  minify: true
});
console.log(res.code.toString());
