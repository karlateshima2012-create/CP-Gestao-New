# Guia de Estilo: CP Gestão - Executive Slate

Este documento define a identidade visual, tipografia e paleta de cores unificada do sistema CP Gestão, baseando-se nos padrões da aba de **Novo Cadastro** e na estética minimalista aprovada.

---

## 🎨 Paleta de Cores (Executive Slate)

O sistema utiliza uma paleta sóbria baseada em tons de cinza azulado (Slate), reservando as cores vibrantes da marca apenas para pontos de destaque estratégico e identificação visual.

### Cores Base (Interface)
| Nome | Hex | Uso |
| :--- | :--- | :--- |
| **Slate 950** | `#020617` | Fundo principal em modo escuro |
| **Slate 900** | `#0F172A` | Background de Sidebar, Botões Primários |
| **Slate 800** | `#1E293B` | Títulos e Textos Principais em modo escuro |
| **Slate 500** | `#64748B` | Textos de Apoio, Subtítulos e Muted Text |
| **Slate 200** | `#E2E8F0` | Bordas sutis, Divisores |
| **Slate 50** | `#F8FAFC` | Fundo principal da aplicação (Dashboard) |

### Cores de Marca (Destaque)
Apenas **uma cor de destaque** deve ser usada para ações principais e feedback positivo.
| Nome | Hex | Uso |
| :--- | :--- | :--- |
| **Azul CP** | `#38B6FF` | Destaque estratégico, Ícones ativos, Call to Action |
| **Magenta CP** | `#E5157A` | Ações de erro/alerta (ex: limite excedido) ou Logo |
| **Amarelo CP** | `#FFF200` | Alertas de atenção (ex: Risco de Churn) |

---

## 🔠 Tipografia

A tipografia do CP Gestão foca em **pesos bold/black** e **tracking (espaçamento) reduzido** para títulos, criando um visual técnico e impactante.

### Hierarquia Visual
Baseada nos componentes da aba **Novo Cadastro (EditorTab)**.

| Elemento | Tamanho (px) | Peso | Estilo | Cor Padrão |
| :--- | :--- | :--- | :--- | :--- |
| **Título da Aba** | `30px` (3xl) | `900` (Black) | Tracking Tight | `Slate 900` |
| **Subtítulo / Descrição** | `18px` (lg) | `500` (Medium) | - | `Slate 500` |
| **Título de Seção** | `14px` (sm) | `900` (Black) | UPPERCASE + Tracking Widest | `Slate 600` |
| **Labels de Input** | `10px` | `900` (Black) | UPPERCASE + Tracking Widest | `Slate 500` |
| **Texto Geral (Body)** | `14px` (sm) | `700` (Bold) | - | `Slate 800` |
| **Texto de Apoio (Muted)** | `12px` (xs) | `900` (Black) | UPPERCASE + Tracking Widest | `Slate 400` |
| **Textos de Botão** | `10px` | `900` (Black) | UPPERCASE + Tracking Widest | `Branco` |
| **Menu Lateral (Item)** | `14px` (sm) | `500` (Medium) | - | `Slate 500` |
| **Menu Lateral (Ativo)**| `14px` (sm) | `700` (Bold) | - | `Slate 900` |

### Valores de KPI (Métricas)
Para números de grande impacto no Dashboard:
- **Tamanho:** `30px` a `36px`
- **Peso:** `900` (Black)
- **Tracking:** `Tighter` (Aproximado)

---

## 🛠️ Regras de Layout
- **Border Radius:** Padrão `8px` (`rounded-lg`) para cards, botões e inputs.
- **Cards:** Fundo branco, borda `Slate 100/200`. Devem incluir uma linha de destaque lateral (`w-1`) na cor correspondente à métrica.
- **Inputs:** Fundo `Slate 50`, bordas `Slate 200`. Foco em `Azul CP`.

---
*Manual de Identidade Visual v2.0 - CP Gestão New*
