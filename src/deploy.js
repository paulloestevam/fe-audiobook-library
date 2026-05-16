import { NodeSSH } from 'node-ssh';
import { execSync } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const ssh = new NodeSSH();

async function deploy() {
    try {
        console.log('📦 Iniciando o Build local...');
        execSync('npm run build', { stdio: 'inherit' });

        console.log('🔌 Conectando ao Raspberry Pi...');
        await ssh.connect({
            host: process.env.DEPLOY_HOST,
            username: process.env.DEPLOY_USERNAME,
            privateKeyPath: process.env.USERPROFILE + '/.ssh/id_ed25519' // Caminho no Windows
        });

        const remoteDir = process.env.DEPLOY_REMOTE_DIR;

        console.log('📁 Criando diretório remoto (se não existir)...');
        await ssh.execCommand(`sudo mkdir -p ${remoteDir}`);
        await ssh.execCommand(`sudo chown -R paull:paull ${remoteDir}`); // Garante permissão para enviar

        console.log('🚀 Transferindo arquivos da pasta dist...');
        const failed = [];
        const successful = [];
        await ssh.putDirectory(path.resolve('dist'), remoteDir, {
            recursive: true,
            concurrency: 10,
            tick: (localPath, remotePath, error) => {
                if (error) failed.push(localPath);
                else successful.push(localPath);
            }
        });

        console.log(`✅ Transferência concluída: ${successful.length} arquivos enviados, ${failed.length} falhas.`);

        console.log('🔄 Reiniciando o Nginx...');
        const result = await ssh.execCommand('sudo systemctl restart nginx');
        if (result.stdout) console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);

        console.log('🎉 Deploy do Frontend finalizado com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro durante o deploy:', error);
        process.exit(1);
    }
}

deploy();
