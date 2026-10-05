# Voxali Desktop (.exe)

O app é uma janela que abre o seu site. Ele não guarda cópia do código:
toda vez que você publica uma versão nova no site, o .exe atualiza sozinho
(confere a cada 2 minutos e recarrega; se você estiver em chamada, espera acabar).

## Gerar o .exe (no Windows, uma vez)
1. Instale o Node.js (nodejs.org).
2. Abra `config.json` e troque `url` pelo endereço real do seu site (https://...).
3. Na pasta, rode no terminal:
   npm install
   npm run build
4. O arquivo `dist/Voxali 1.0.0.exe` é o programa. Pode mandar para os amigos.

Para testar sem gerar o .exe: `npm start`.

## Observações
- Só precisa gerar o .exe de novo se mudar o `main.js` ou o endereço do site.
- Microfone, câmera e compartilhar tela já vêm liberados.
- O Windows pode mostrar aviso "editor desconhecido" (o .exe não é assinado).

## Sem instalar nada: gerar o .exe pelo GitHub
1. Crie um repositório no github.com e suba todos os arquivos desta pasta (inclusive a pasta `.github`).
2. Edite `config.json` e coloque o endereço do seu site.
3. Aba **Actions** → "Gerar Voxali.exe" → **Run workflow**.
4. Quando terminar (uns 3 min), abra a execução e baixe **Voxali-exe** no fim da página: dentro está o .exe.
