import * as cps from 'node:child_process';

const red = '\x1b[31m%s\x1b[0m';
const green = '\x1b[32m%s\x1b[0m';
const cyan = '\x1b[36m%s\x1b[0m';

const linkedProject = process.env.LINKED_PROJECT_PATH;
if (!linkedProject) {
  console.error(red, 'LINKED_PROJECT not set');
  process.exit(1);
}
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(red, 'No arguments provided');
  process.exit(1);
}

if (args.includes('--link')) {
  cps.execSync(`pnpm link --dir ${linkedProject}`, { stdio: 'inherit' });
  console.log(cyan, `ready to be linked from ${linkedProject}.`);
}