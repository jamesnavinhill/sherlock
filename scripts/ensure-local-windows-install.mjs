import os from 'node:os';

const isCi = process.env.CI === 'true' || process.env.CI === '1';
const allowOverride = process.env.SHERLOCK_ALLOW_WSL_INSTALL === '1';
const isWsl = process.platform === 'linux' && os.release().toLowerCase().includes('microsoft');
const windowsMountedCheckout = /^\/mnt\/([a-z])\/(.*)$/i.exec(process.cwd());

if (isCi || allowOverride || !isWsl || !windowsMountedCheckout) {
  process.exit(0);
}

const [, driveLetter, restOfPath] = windowsMountedCheckout;
const windowsPath = `${driveLetter.toUpperCase()}:\\${restOfPath.replace(/\//g, '\\')}`;

console.error('');
console.error('Sherlock local installs must run from Windows for this checkout.');
console.error(`Detected WSL install attempt in a Windows-mounted repo: ${process.cwd()}`);
console.error('');
console.error('Use Command Prompt or PowerShell instead:');
console.error(`  cd /d "${windowsPath}"`);
console.error('  npm install');
console.error('');
console.error('If this repo is intentionally being installed from WSL, set SHERLOCK_ALLOW_WSL_INSTALL=1.');
console.error('');

process.exit(1);
