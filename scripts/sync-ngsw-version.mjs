import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const CHECK_FLAG = '--check';

const packageJsonPath = resolve(process.cwd(), 'package.json');
const ngswConfigPath = resolve(process.cwd(), 'ngsw-config.json');
const isCheckMode = process.argv.includes(CHECK_FLAG);

const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
const ngswConfig = JSON.parse(await readFile(ngswConfigPath, 'utf8'));

const nextVersion = packageJson.version;
const currentVersion = ngswConfig?.appData?.version;

if (typeof nextVersion !== 'string' || nextVersion.length === 0) {
  throw new Error('package.json version is missing or invalid.');
}

if (isCheckMode) {
  if (currentVersion !== nextVersion) {
    console.error(
      `Version mismatch: package.json=${nextVersion}, ngsw-config.appData.version=${currentVersion ?? 'undefined'}`,
    );
    process.exitCode = 1;
  } else {
    console.log(`Version sync check passed: ${nextVersion}`);
  }
  process.exit();
}

const updatedNgswConfig = {
  ...ngswConfig,
  appData: {
    ...(ngswConfig.appData ?? {}),
    version: nextVersion,
  },
};

const nextConfigContent = `${JSON.stringify(updatedNgswConfig, null, 2)}\n`;
const currentConfigContent = `${JSON.stringify(ngswConfig, null, 2)}\n`;

if (nextConfigContent === currentConfigContent) {
  console.log(`ngsw-config.json already synced to ${nextVersion}`);
  process.exit();
}

await writeFile(ngswConfigPath, nextConfigContent, 'utf8');
console.log(`Synced ngsw-config.json appData.version to ${nextVersion}`);
