#!/usr/bin/env python3
"""
Validate Traceability Script
Verifica se todos os requisitos funcionais têm cobertura no backlog
e se todas as stories têm acceptance criteria.

Uso:
    python3 .agents/scripts/validate_traceability.py
    python3 .agents/scripts/validate_traceability.py --strict
    python3 .agents/scripts/validate_traceability.py --output json
"""

import os
import re
import json
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict

# Paths
DOCS_DIR = Path("docs")
PLANNING_DIR = DOCS_DIR / "planning"
PRD_PATH = PLANNING_DIR / "02-prd.md"
BACKLOG_PATH = DOCS_DIR / "BACKLOG.md"
BRIEF_PATH = PLANNING_DIR / "01-product-brief.md"
DESIGN_PATH = PLANNING_DIR / "03-design-system.md"
DATABASE_PATH = PLANNING_DIR / "04-database.md"
JOURNEYS_PATH = PLANNING_DIR / "05-user-journeys.md"
REPORT_PATH = PLANNING_DIR / "TRACEABILITY-REPORT.md"


@dataclass
class ValidationResult:
    """Resultado de uma validação"""
    passed: bool
    message: str
    details: Optional[List[str]] = None


@dataclass
class TraceabilityReport:
    """Relatório completo de rastreabilidade"""
    timestamp: str
    documents_found: Dict[str, bool]
    requirements: List[Dict]
    stories: List[Dict]
    coverage_percentage: float
    stories_with_ac_percentage: float
    orphan_stories: List[str]
    uncovered_requirements: List[str]
    issues: List[Dict]
    status: str  # "PASSED", "PASSED_WITH_WARNINGS", "FAILED"


def read_file(path: Path) -> Optional[str]:
    """Lê conteúdo de um arquivo se existir"""
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return None


def extract_requirements(prd_content: str) -> List[Dict]:
    """Extrai requisitos funcionais do PRD"""
    requirements = []

    # Padrões para encontrar RFs
    patterns = [
        r'###?\s*(RF[-_]?\d+)[:\s]+([^\n]+)',  # ### RF01: Nome
        r'\*\*(RF[-_]?\d+)\*\*[:\s]+([^\n]+)',  # **RF01:** Nome
        r'\|\s*(RF[-_]?\d+)\s*\|([^|]+)\|',     # | RF01 | Nome |
        r'(RF[-_]?\d+)[:\s]+([^\n]+)',          # RF01: Nome
    ]

    for pattern in patterns:
        matches = re.findall(pattern, prd_content, re.IGNORECASE)
        for match in matches:
            rf_id = match[0].upper().replace('_', '-').replace('RF', 'RF-')
            if not rf_id.startswith('RF-'):
                rf_id = 'RF-' + rf_id.replace('RF', '')
            # Normaliza para RF-01, RF-02, etc
            rf_id = re.sub(r'RF-?(\d+)', lambda m: f'RF-{m.group(1).zfill(2)}', rf_id)

            description = match[1].strip()[:100]  # Limita descrição

            # Evita duplicatas
            if not any(r['id'] == rf_id for r in requirements):
                requirements.append({
                    'id': rf_id,
                    'description': description,
                    'covered': False,
                    'stories': []
                })

    return requirements


def extract_stories(backlog_content: str) -> List[Dict]:
    """Extrai stories do backlog"""
    stories = []

    # Padrões para encontrar stories
    patterns = [
        r'###?\s*Story\s+(\d+\.\d+)[:\s]+([^\n]+)',  # ### Story 1.1: Nome
        r'\*\*Story\s+(\d+\.\d+)\*\*[:\s]+([^\n]+)',  # **Story 1.1:** Nome
        r'-\s*\[[ x]\]\s*\*\*Story\s+(\d+\.\d+)[:\*]*\s*([^\n]+)',  # - [ ] **Story 1.1:** Nome
    ]

    for pattern in patterns:
        matches = re.findall(pattern, backlog_content, re.IGNORECASE)
        for match in matches:
            story_id = f"Story-{match[0]}"
            description = match[1].strip().replace('**', '')[:100]

            # Evita duplicatas
            if not any(s['id'] == story_id for s in stories):
                stories.append({
                    'id': story_id,
                    'description': description,
                    'has_acceptance_criteria': False,
                    'requirements': []
                })

    return stories


def check_story_has_ac(backlog_content: str, story_id: str) -> bool:
    """Verifica se uma story tem Acceptance Criteria"""
    # Encontra a seção da story
    story_pattern = rf'Story\s+{story_id.replace("Story-", "")}[:\s]+'
    match = re.search(story_pattern, backlog_content, re.IGNORECASE)

    if not match:
        return False

    # Pega conteúdo após a story até a próxima story ou epic
    start_pos = match.end()
    next_section = re.search(r'(###?\s*Story|##\s*Epic)', backlog_content[start_pos:])
    end_pos = start_pos + next_section.start() if next_section else len(backlog_content)

    section_content = backlog_content[start_pos:end_pos]

    # Verifica presença de AC
    ac_patterns = [
        r'Critérios?\s+de\s+Aceite',
        r'Acceptance\s+Criteria',
        r'Given\s+.+When\s+.+Then',
        r'DADO\s+.+QUANDO\s+.+ENTÃO',
        r'-\s*\[\s*\]\s*.+',  # Checkboxes como AC
    ]

    for pattern in ac_patterns:
        if re.search(pattern, section_content, re.IGNORECASE):
            return True

    return False


def map_requirements_to_stories(requirements: List[Dict], backlog_content: str) -> None:
    """Mapeia quais stories cobrem quais requisitos"""
    for req in requirements:
        # Busca menções ao RF no backlog
        rf_patterns = [
            req['id'],
            req['id'].replace('-', ''),
            req['id'].replace('RF-', 'RF'),
            req['id'].replace('RF-0', 'RF-'),
        ]

        for pattern in rf_patterns:
            if pattern.lower() in backlog_content.lower():
                req['covered'] = True
                # Encontra qual story menciona
                lines = backlog_content.split('\n')
                current_story = None
                for line in lines:
                    story_match = re.search(r'Story\s+(\d+\.\d+)', line, re.IGNORECASE)
                    if story_match:
                        current_story = f"Story-{story_match.group(1)}"
                    if pattern.lower() in line.lower() and current_story:
                        if current_story not in req['stories']:
                            req['stories'].append(current_story)


def find_orphan_stories(stories: List[Dict], requirements: List[Dict]) -> List[str]:
    """Encontra stories que não estão vinculadas a nenhum requisito"""
    covered_stories = set()
    for req in requirements:
        covered_stories.update(req['stories'])

    orphans = []
    for story in stories:
        if story['id'] not in covered_stories:
            orphans.append(story['id'])

    return orphans


def generate_issues(
    requirements: List[Dict],
    stories: List[Dict],
    orphan_stories: List[str],
    documents_found: Dict[str, bool]
) -> List[Dict]:
    """Gera lista de issues encontrados"""
    issues = []

    # Documentos faltando
    for doc, found in documents_found.items():
        if not found:
            issues.append({
                'type': 'CRITICAL' if doc == 'Backlog' else 'WARNING',
                'category': 'document_missing',
                'message': f'Documento não encontrado: {doc}',
                'suggestion': f'Execute /define para criar {doc}'
            })

    # Requisitos sem cobertura
    for req in requirements:
        if not req['covered']:
            issues.append({
                'type': 'CRITICAL',
                'category': 'requirement_uncovered',
                'message': f'{req["id"]} não tem cobertura no backlog',
                'suggestion': f'Criar Story para cobrir: {req["description"][:50]}...'
            })

    # Stories sem AC
    for story in stories:
        if not story['has_acceptance_criteria']:
            issues.append({
                'type': 'WARNING',
                'category': 'missing_acceptance_criteria',
                'message': f'{story["id"]} não tem Acceptance Criteria',
                'suggestion': 'Adicionar critérios em formato Given/When/Then'
            })

    # Stories órfãs
    for story_id in orphan_stories:
        issues.append({
            'type': 'INFO',
            'category': 'orphan_story',
            'message': f'{story_id} não está vinculada a nenhum requisito',
            'suggestion': 'Vincular a um RF existente ou documentar justificativa'
        })

    return issues


def determine_status(issues: List[Dict]) -> str:
    """Determina status geral baseado nos issues"""
    critical_count = sum(1 for i in issues if i['type'] == 'CRITICAL')
    warning_count = sum(1 for i in issues if i['type'] == 'WARNING')

    if critical_count > 0:
        return "FAILED"
    elif warning_count > 0:
        return "PASSED_WITH_WARNINGS"
    else:
        return "PASSED"


def generate_markdown_report(report: TraceabilityReport) -> str:
    """Gera relatório em formato Markdown"""
    status_emoji = {
        "PASSED": "✅",
        "PASSED_WITH_WARNINGS": "⚠️",
        "FAILED": "❌"
    }

    md = f"""# Relatório de Rastreabilidade

**Gerado em:** {report.timestamp}
**Status:** {status_emoji.get(report.status, '❓')} {report.status}

---

## Resumo Executivo

| Métrica | Valor | Status |
|---------|-------|--------|
| Cobertura de Requisitos | {report.coverage_percentage:.1f}% | {'✅' if report.coverage_percentage >= 100 else '❌'} |
| Stories com AC | {report.stories_with_ac_percentage:.1f}% | {'✅' if report.stories_with_ac_percentage >= 80 else '⚠️'} |
| Stories Órfãs | {len(report.orphan_stories)} | {'✅' if len(report.orphan_stories) == 0 else '⚠️'} |
| Issues Críticos | {sum(1 for i in report.issues if i['type'] == 'CRITICAL')} | {'✅' if sum(1 for i in report.issues if i['type'] == 'CRITICAL') == 0 else '❌'} |

---

## Inventário de Documentos

| Documento | Status |
|-----------|--------|
"""

    for doc, found in report.documents_found.items():
        md += f"| {doc} | {'✅ Encontrado' if found else '❌ Faltando'} |\n"

    md += f"""
---

## Matriz de Rastreabilidade

| Requisito | Descrição | Stories | Status |
|-----------|-----------|---------|--------|
"""

    for req in report.requirements:
        stories_str = ', '.join(req['stories']) if req['stories'] else '-'
        status = '✅' if req['covered'] else '❌'
        md += f"| {req['id']} | {req['description'][:40]}... | {stories_str} | {status} |\n"

    md += f"""
---

## Cobertura de Stories

| Story | Descrição | Acceptance Criteria |
|-------|-----------|---------------------|
"""

    for story in report.stories:
        ac_status = '✅' if story['has_acceptance_criteria'] else '❌'
        md += f"| {story['id']} | {story['description'][:40]}... | {ac_status} |\n"

    if report.orphan_stories:
        md += f"""
---

## Stories Órfãs (Sem RF vinculado)

"""
        for story_id in report.orphan_stories:
            md += f"- {story_id}\n"

    if report.uncovered_requirements:
        md += f"""
---

## Requisitos Sem Cobertura

"""
        for req_id in report.uncovered_requirements:
            md += f"- {req_id}\n"

    md += f"""
---

## Issues Encontrados

"""

    critical_issues = [i for i in report.issues if i['type'] == 'CRITICAL']
    warning_issues = [i for i in report.issues if i['type'] == 'WARNING']
    info_issues = [i for i in report.issues if i['type'] == 'INFO']

    if critical_issues:
        md += "### 🔴 Críticos (Bloqueadores)\n\n"
        for i, issue in enumerate(critical_issues, 1):
            md += f"{i}. **{issue['message']}**\n   - Sugestão: {issue['suggestion']}\n\n"

    if warning_issues:
        md += "### 🟡 Alertas\n\n"
        for i, issue in enumerate(warning_issues, 1):
            md += f"{i}. **{issue['message']}**\n   - Sugestão: {issue['suggestion']}\n\n"

    if info_issues:
        md += "### 🔵 Informações\n\n"
        for i, issue in enumerate(info_issues, 1):
            md += f"{i}. {issue['message']}\n   - Sugestão: {issue['suggestion']}\n\n"

    if not report.issues:
        md += "Nenhum issue encontrado! 🎉\n"

    md += f"""
---

## Próximos Passos

"""

    if report.status == "PASSED":
        md += """✅ **Documentação completa e rastreável!**

1. Execute `/readiness` para validação completa
2. Inicie implementação com `implementar Story 1.1`
"""
    elif report.status == "PASSED_WITH_WARNINGS":
        md += """⚠️ **Pode prosseguir, mas corrija os alertas:**

1. Adicione Acceptance Criteria às stories faltantes
2. Vincule stories órfãs a requisitos
3. Execute este script novamente para verificar
"""
    else:
        md += """❌ **Corrija os bloqueadores antes de prosseguir:**

1. Resolva todos os issues críticos listados
2. Atualize a documentação correspondente
3. Execute este script novamente
"""

    return md


def print_console_report(report: TraceabilityReport, verbose: bool = False) -> None:
    """Imprime relatório no console"""
    status_colors = {
        "PASSED": "\033[92m",  # Verde
        "PASSED_WITH_WARNINGS": "\033[93m",  # Amarelo
        "FAILED": "\033[91m"  # Vermelho
    }
    reset = "\033[0m"

    print("\n" + "=" * 60)
    print("📋 RELATÓRIO DE RASTREABILIDADE")
    print("=" * 60)

    status_color = status_colors.get(report.status, "")
    print(f"\nStatus: {status_color}{report.status}{reset}")

    print(f"\n📊 Métricas:")
    print(f"   • Cobertura de Requisitos: {report.coverage_percentage:.1f}%")
    print(f"   • Stories com AC: {report.stories_with_ac_percentage:.1f}%")
    print(f"   • Stories Órfãs: {len(report.orphan_stories)}")
    print(f"   • Issues Críticos: {sum(1 for i in report.issues if i['type'] == 'CRITICAL')}")

    print(f"\n📁 Documentos:")
    for doc, found in report.documents_found.items():
        icon = "✅" if found else "❌"
        print(f"   {icon} {doc}")

    if report.uncovered_requirements:
        print(f"\n❌ Requisitos Sem Cobertura:")
        for req_id in report.uncovered_requirements[:5]:
            print(f"   • {req_id}")
        if len(report.uncovered_requirements) > 5:
            print(f"   ... e mais {len(report.uncovered_requirements) - 5}")

    critical_issues = [i for i in report.issues if i['type'] == 'CRITICAL']
    if critical_issues:
        print(f"\n🔴 Issues Críticos:")
        for issue in critical_issues[:5]:
            print(f"   • {issue['message']}")
        if len(critical_issues) > 5:
            print(f"   ... e mais {len(critical_issues) - 5}")

    print(f"\n📄 Relatório salvo em: {REPORT_PATH}")
    print("=" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description='Valida rastreabilidade entre requisitos e backlog')
    parser.add_argument('--strict', action='store_true', help='Falha se houver qualquer warning')
    parser.add_argument('--output', choices=['console', 'json', 'markdown'], default='console')
    parser.add_argument('--verbose', '-v', action='store_true', help='Saída detalhada')
    args = parser.parse_args()

    # Verifica documentos
    documents_found = {
        'Product Brief': BRIEF_PATH.exists(),
        'PRD': PRD_PATH.exists(),
        'Design System': DESIGN_PATH.exists(),
        'Database': DATABASE_PATH.exists(),
        'Backlog': BACKLOG_PATH.exists(),
        'User Journeys': JOURNEYS_PATH.exists(),
    }

    # Se não tem nem PRD nem Backlog, não pode continuar
    if not documents_found['PRD'] and not documents_found['Backlog']:
        print("ℹ️  Nenhum PRD ou Backlog encontrado. Execute /define para criar documentação de projeto.")
        print("   Validação de rastreabilidade não é aplicável sem documentos de planejamento.")
        exit(0)

    # Lê conteúdo dos arquivos (tolerante a ausência)
    prd_content = read_file(PRD_PATH) or ""
    backlog_content = read_file(BACKLOG_PATH) or ""

    # Extrai dados
    requirements = extract_requirements(prd_content) if prd_content else []
    stories = extract_stories(backlog_content) if backlog_content else []

    # Mapeia cobertura
    map_requirements_to_stories(requirements, backlog_content)

    # Verifica AC em cada story
    for story in stories:
        story['has_acceptance_criteria'] = check_story_has_ac(backlog_content, story['id'])

    # Encontra órfãs
    orphan_stories = find_orphan_stories(stories, requirements)

    # Calcula métricas
    covered_count = sum(1 for r in requirements if r['covered'])
    coverage_pct = (covered_count / len(requirements) * 100) if requirements else 100

    ac_count = sum(1 for s in stories if s['has_acceptance_criteria'])
    ac_pct = (ac_count / len(stories) * 100) if stories else 100

    uncovered = [r['id'] for r in requirements if not r['covered']]

    # Gera issues
    issues = generate_issues(requirements, stories, orphan_stories, documents_found)

    # Determina status
    status = determine_status(issues)
    if args.strict and status == "PASSED_WITH_WARNINGS":
        status = "FAILED"

    # Cria relatório
    report = TraceabilityReport(
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        documents_found=documents_found,
        requirements=requirements,
        stories=stories,
        coverage_percentage=coverage_pct,
        stories_with_ac_percentage=ac_pct,
        orphan_stories=orphan_stories,
        uncovered_requirements=uncovered,
        issues=issues,
        status=status
    )

    # Output
    if args.output == 'json':
        print(json.dumps(asdict(report), indent=2, ensure_ascii=False))
    elif args.output == 'markdown':
        md_report = generate_markdown_report(report)
        print(md_report)
        # Também salva em arquivo
        REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(REPORT_PATH, 'w', encoding='utf-8') as f:
            f.write(md_report)
    else:
        # Sempre salva markdown
        md_report = generate_markdown_report(report)
        REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(REPORT_PATH, 'w', encoding='utf-8') as f:
            f.write(md_report)

        print_console_report(report, args.verbose)

    # Exit code
    if status == "FAILED":
        exit(1)
    elif status == "PASSED_WITH_WARNINGS" and args.strict:
        exit(1)
    else:
        exit(0)


if __name__ == "__main__":
    main()
