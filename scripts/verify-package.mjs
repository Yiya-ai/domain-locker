import { lstat, readFile, readdir } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';

// Verify the files that will leave the host. Never print matching contents.
const forbiddenName =
  /^(?:\.env(?:\..*)?|\.npmrc|\.git|\.playwright-cli|credentials(?:\..*)?|id_(?:rsa|ed25519)(?:\..*)?)$|\.(?:csv|sqlite3?|db)(?:[-.].*)?$|\.(?:pem|key|p12|pfx|dpapi|kdbx|bak|tgz|zip)$/i;
const secret =
  /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----[\r\n]+[A-Za-z0-9+/]{32,}|(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{80,}|AKIA[A-Z0-9]{16})\b/;
const sensitiveValues = [
  'DL_AUTH_PASSWORD',
  'DL_DB_KEY',
  'DL_AUTH_SECRET',
  'DL_API_KEY',
  'DL_PG_PASSWORD',
  'RESEND_KEY',
]
  .map((name) => process.env[name])
  .filter((value) => value && value.length >= 8)
  .map((value) => Buffer.from(value));
let files = 0;
async function verify(root, file) {
  const stat = await lstat(file);
  if (
    stat.isSymbolicLink() ||
    forbiddenName.test(basename(file)) ||
    /^data(?:[\\/]|$)/i.test(relative(root, file))
  )
    throw new Error('Excluded file: ' + relative(root, file));
  if (stat.isDirectory()) {
    for (const child of await readdir(file)) await verify(root, join(file, child));
    return;
  }
  if (!stat.isFile()) throw new Error('Unexpected file type: ' + relative(root, file));
  const data = await readFile(file);
  if (
    data.subarray(0, 16).equals(Buffer.from('SQLite format 3\0')) ||
    sensitiveValues.some((value) => data.includes(value)) ||
    secret.test(data.toString('latin1'))
  ) {
    throw new Error('Sensitive content in ' + relative(root, file));
  }
  files++;
}
const paths = process.argv.slice(2);
if (!paths.length) throw new Error('Supply the staging directories to verify.');
for (const directory of paths) await verify(resolve(directory), resolve(directory));
console.log('Verified ' + files + ' release files.');
