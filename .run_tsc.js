const { spawn } = require('child_process');
const fs = require('fs');
const out = fs.createWriteStream('./typecheck_output.txt');
const tsc = spawn('npx', ['tsc', '--project', 'tsconfig.strict.json', '--noEmit', '--pretty', 'false'], { shell: true });

tsc.stdout.pipe(out);
tsc.stderr.pipe(out);

tsc.on('close', (code) => {
  console.log('TSC_EXIT_CODE=' + code);
});
