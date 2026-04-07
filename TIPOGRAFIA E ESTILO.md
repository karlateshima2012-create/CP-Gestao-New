# 📐 TIPOGRAFIA E ESTILO — CP Gestão
> **Referência canônica do sistema de design.**  
> Mapeado a partir das abas: Dashboard, Solicitações de Pontos, No Cadastro, Meus Clientes e Exportar Dados.  
> Aplicado como padrão correto também nas abas: Configurações e Programa de Fidelidade.

---

## 1. Página — Cabeçalho (Page Header)

Todo cabeçalho de aba deve seguir exatamente este padrão:

```tsx
<div>
  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
    Título da Aba
  </h1>
  <p className="text-lg text-slate-500 dark:text-slate-400 mt-1 font-medium">
    Descrição curta e objetiva da seção.
  </p>
</div>
```

| Propriedade     | Valor                                    |
|-----------------|------------------------------------------|
| Tamanho h1      | `text-3xl`                               |
| Peso h1         | `font-extrabold`                         |
| Cor h1 (light)  | `text-slate-900`                         |
| Cor h1 (dark)   | `dark:text-white`                        |
| Tracking h1     | `tracking-tight leading-none`            |
| H1 uppercase?   | ❌ NÃO usar `uppercase` no h1            |
| Subtítulo       | `text-lg font-medium text-slate-500`     |
| Subtítulo mt    | `mt-1` (nunca `mt-2`)                    |
| Subtítulo italic| ❌ NÃO usar `italic` no subtítulo        |

---

## 2. Section Header (Cabeçalho de Seção Interna)

Usado para separar seções dentro de uma aba. Padrão extraído de Dashboard e ExportTab:

```tsx
<div className="flex items-center gap-3">
  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
    <IconeAqui className="w-4 h-4 text-slate-600 dark:text-slate-400" />
  </div>
  <div>
    <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white capitalize">
      Título da Seção
    </h2>
    {/* Subtítulo opcional */}
    <p className="text-base font-medium text-slate-500 dark:text-slate-400 mt-1">
      Subtítulo opcional da seção.
    </p>
  </div>
</div>
```

> ⚠️ **NÃO usar** `h3`, `text-primary-500` no ícone do section header, nem `bg-primary-500/10`.  
> O padrão correto usa `bg-slate-100` com `text-slate-600` para o ícone — neutro e profissional.

---

## 3. Card Container

### Card Principal (seções de conteúdo)
Usado em Exportar Dados, Configurações e Programa de Fidelidade:

```tsx
<Card className="p-8 border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[28px] space-y-8">
```

| Propriedade   | Valor                              |
|---------------|------------------------------------|
| Padding       | `p-8`                              |
| Borda         | `border-none`                      |
| Sombra        | `shadow-xl shadow-slate-200/50`    |
| Border-radius | `rounded-[28px]`                   |
| Background    | `bg-white dark:bg-slate-900`       |

### Card de KPI / Dado (Dashboard)
```tsx
<Card className="p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
```

| Propriedade   | Valor                                    |
|---------------|------------------------------------------|
| Padding       | `p-5`                                    |
| Borda         | `border border-slate-100 dark:border-slate-800` |
| Sombra        | `shadow-sm`                              |
| Border-radius | padrão do `<Card>` (normalmente `rounded-xl`) |

### Card de Insight / Insight Estratégico (Dashboard)
```tsx
<Card className="p-8 border border-slate-100 bg-white shadow-sm relative overflow-hidden group rounded-2xl">
```

---

## 4. Card Header Interno (dentro de um Card)

Padrão para o título interno de um card (ícone + texto):

```tsx
<div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800/50">
  <IconeAqui className="w-5 h-5 text-slate-400" />
  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
    TÍTULO DO CARD
  </h2>
</div>
```

| Propriedade   | Valor                              |
|---------------|------------------------------------|
| Tamanho       | `text-sm`                          |
| Peso          | `font-black`                       |
| Cor           | `text-slate-900 dark:text-white`   |
| Case          | `uppercase`                        |
| Tracking      | `tracking-widest`                  |
| Ícone         | `w-5 h-5 text-slate-400`           |

---

## 5. Labels de Campos (Form Labels)

Usado em todos os formulários e seções de configuração:

```tsx
<label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
  Nome do Campo
</label>
```

| Propriedade | Valor              |
|-------------|--------------------|
| Tamanho     | `text-[10px]`      |
| Peso        | `font-black`       |
| Cor         | `text-slate-400`   |
| Case        | `uppercase`        |
| Tracking    | `tracking-widest`  |

---

## 6. Campos de Texto (Inputs e Textareas)

```tsx
<input
  className="w-full h-12 px-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold text-sm"
/>
```

| Propriedade   | Valor                              |
|---------------|------------------------------------|
| Altura        | `h-12` (input padrão)              |
| Border-radius | `rounded-xl`                       |
| Background    | `bg-slate-50 dark:bg-slate-950`    |
| Borda         | `border border-slate-100 dark:border-slate-800` |
| Fonte         | `font-bold text-sm`                |
| Focus ring    | `focus:ring-2 focus:ring-primary-500` |

---

## 7. Botões Primários (CTAs)

```tsx
<Button className="h-14 px-10 bg-[#38B6FF] hover:bg-[#38B6FF]/90 text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-xl shadow-blue-500/10 border-none">
  AÇÃO PRINCIPAL
</Button>
```

| Propriedade   | Valor                              |
|---------------|------------------------------------|
| Altura        | `h-14`                             |
| Background    | `bg-[#38B6FF]`                     |
| Hover         | `hover:bg-[#38B6FF]/90`            |
| Texto         | `text-white text-xs font-black uppercase tracking-[0.2em]` |
| Border-radius | `rounded-xl` ou `rounded-2xl`      |
| Sombra        | `shadow-xl shadow-blue-500/10`     |
| Borda         | `border-none`                      |

> ❌ **NÃO usar** `bg-primary-600`, `tracking-widest` ou `tracking-wider` em botões primários.

---

## 8. Tipografia de Tabelas

### Cabeçalho de Coluna (th)
```tsx
<th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
  Coluna
</th>
```

### Texto Principal de Linha (nome, dado primário)
```tsx
<span className="text-sm font-bold text-gray-900 dark:text-white capitalize">
  Dado Principal
</span>
```

### Texto Secundário de Linha (subtexto, telefone, data)
```tsx
<span className="text-[11px] text-gray-400 font-medium font-mono">
  Dado Secundário
</span>
```

### Metadado / Label de coluna de dados
```tsx
<span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">
  EMPRESA
</span>
```

---

## 9. Badges e Status Pills

```tsx
{/* Status aprovado */}
<span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600">
  APROVADO
</span>

{/* Status negado */}
<span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-600">
  NEGADO
</span>

{/* Badge KPI / Trend */}
<div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-emerald-50 text-emerald-600">
  +XX%
</div>
```

---

## 10. Valores de KPI (números grandes)

```tsx
<h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
  {valor}
</h3>
<p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
  LABEL DO KPI
</p>
```

---

## 11. Regras Gerais

| Regra | ✅ Correto | ❌ Evitar |
|-------|-----------|----------|
| H1 de aba | `font-extrabold tracking-tight` | `uppercase`, `italic`, `font-bold` |
| Subtítulo de aba | `text-lg font-medium mt-1` | `mt-2`, `italic`, `font-semibold` |
| Section header ícone | `bg-slate-100 text-slate-600` | `bg-primary-500/10 text-primary-500` |
| Section header tag | `<h2 font-extrabold>` | `<h3 font-bold>` |
| Botão primário cor | `bg-[#38B6FF]` | `bg-primary-600`, `bg-primary-500` |
| Botão primário tracking | `tracking-[0.2em]` | `tracking-widest`, `tracking-wider` |
| Card principal radius | `rounded-[28px]` (seções grandes) | `rounded-2xl` em seções grandes |
| Card de dado/KPI radius | `rounded-2xl` ou padrão Card | misturar com `rounded-[28px]` |
| Inputs | `rounded-xl` | `rounded-lg` em inputs principais |
| Texto de label | `text-[10px] font-black uppercase` | `text-xs`, `font-bold`, sem uppercase |
