# Flujo de Trabajo Git - BCC-TOTP-KEYS
Este documento describe el proceso para gestionar ramas (`main` y `dev`), creación de features, y aprobación de cambios.

# 1.-Estructura de Ramas
- `main`: Rama principal (producción. Sólo acepta cambios desde `dev` mediante PRs aprobados.
- `dev`: Rama de desarrollo (integraciones estables). Aquí se fusionan las ramas de features/fixes.
- `**features/**` o `fix/*`: Ramas temporales para nuevas funcoinalidades o correcciones

# 2.-Comandos Básicos
 Configuración inicial
```
# Clonar repositorio
git clone https://github.com/BajaCallCenter/BCC-TOTP-KEYS.git
cd BCC-TOTP-KEYS

# Sincronizar ramas principales
git checkout main
git pull origin main
git checkout dev
git pull origin dev
```

Crear una nueva rama de trabajo
```
# Basar la nueva rama en dev (siempre empezar desde aquí)
git checkout dev
git pull origin dev
git checkout -b feature/nombre-de-la-funcionalidad  # Ej: feature/login-ui
```

Trabajar y subir cambios
```
# Hacer commits locales
git add .
git commit -m "Descripción clara de los cambios"

# Subir la rama al repositorio remoto (primera vez)
git push -u origin feature/nombre-de-la-funcionalidad
```

Crear un Pull Request (PR) a `dev`
1. Ir a GitHub > Repositorio > Pestaña "Pull Requests".
2. Crear un PR desde `feature/...` → `dev`.
3. Solicitar revisión a los colaboradores.

Si el PR es aprobado y mergeado
```
# Actualizar rama dev local
git checkout dev
git pull origin dev

# Opcional: Eliminar la rama local (si ya no se necesita)
git branch -d feature/nombre-de-la-funcionalidad
```

Promover cambios de `dev` a `main` (release)
```
# Sincronizar main local
git checkout main
git pull origin main

# Fusionar dev en main (solo después de aprobación)
git merge dev
git push origin main

# Opcional: Crear un tag para la versión
git tag -a v1.0.0 -m "Versión estable 1.0.0"
git push origin --tags
```

# 3.- Diagrama de Flujo
![image](https://github.com/user-attachments/assets/4f48a83e-9772-49b2-987f-ba00e015d887)

# 4.- Buenas practicas
1. Nombres descriptivos en ramas:
  - `feature/login-ui`, `fix/auth-bug`.
2. Commits atómicos: Cambios pequeños y autocontenidos.
3. Sincronizar frecuentemente:
```
git checkout dev
git pull origin dev
```
4. Proteger main:
  - Configurar en GitHub:
   Settings > Branches > Add rule for `main`:
    - Require pull requests.
    - Require approvals.

# 5.- Resolución de conflictos
Si hay conflictos al hacer merge o pull:
```
# Ejecutar después de git merge o git pull
git status  # Ver archivos conflictivos
# Editar manualmente los archivos (VS Code marca los conflictos)
git add .   # Marcar como resueltos
git commit  # Finalizar la resolución
```

# 6.- Comandos útiles
| Comando | Descripción |
|---|---|
| `git branch -a` | Lista todas las ramas (locales/remotas) |
| `git fetch --all` | Actualiza referencias de ramas remotas |
| `git log --oneline --graph` | Ver historial compacto |
