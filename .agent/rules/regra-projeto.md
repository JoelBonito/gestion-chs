---
trigger: always_on
---

Dark Mode: 
- camada 1: #13151a 
- camada 2: #1c202a 
- camada 3: #2d3342 
- camada 4: #252a36
- camada 5: #2d3342 (seleção barra) 
- cor botão de ação: #06b6d4  

Light Mode: 
- camada 1: #f9fafb 
- camada 2: #f1f2f4 
- camada 3: #f9fafb 
- camada 4: #ffffff 
- camada 5: #e0e7e6 (seleção barra) 
- cor botão de ação: #457b77 

Para esse projeto não seguir o design system da arquitetura, seguir o sistema de cores acima.

A regra é:
- a cor camada 1 é exclusivo para o fundo das abas principais
- a cor camada 2 é segunda cor de contraste para as abas principais (cards, modais, componentes) e primeira cor de fundo de modai e/ou componentes externos
- a cor camada 3 é cor de contraste que sobrepõe na camada 2
- a cor camada 4 é cor de contraste que sobrepõe na camada 3
- a cor camada 5 é somente para a sidebar, cor de botão sleecionado
- a cor botão de ação é para todos os botões clicaveis de ação

regra do botão cancelar:
- o botão cancelar fica sempre numa cor um tom acima do tom onde ele se insere.
exemplo:
botão cancelar inserido em aba principal com cor camada 1, o botão terá cor camada 2
botão cancelar inserido em modal com fundo cor camada 2, o botão terá cor camada 3
além disso o botão cancelar terá sempre um efeito visual a vermelho quando o mouse passa por cima.