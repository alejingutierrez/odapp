#!/bin/bash

# ODA Platform - Development Environment Setup Script
# Usage: ./scripts/docker-dev.sh [start|stop|restart|logs|reset]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.development"

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    print_status "Verificando requisitos..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose no está instalado"
        exit 1
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "Archivo $ENV_FILE no encontrado, copiando desde ejemplo..."
        cp .env.development.example "$ENV_FILE"
        print_success "Archivo $ENV_FILE creado. Revisa la configuración antes de continuar."
    fi
}

start_services() {
    print_status "Iniciando servicios de desarrollo..."
    
    # Start infrastructure services
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    print_status "Esperando que los servicios estén listos..."
    sleep 10
    
    # Check service health
    print_status "Verificando estado de los servicios..."
    docker-compose -f "$COMPOSE_FILE" ps
    
    print_success "Servicios de desarrollo iniciados!"
    print_status "URLs disponibles:"
    echo "  - PostgreSQL: localhost:5433"
    echo "  - Redis: localhost:6380"
    echo "  - Elasticsearch: http://localhost:9200"
    echo "  - Kibana: http://localhost:5601"
    echo "  - RabbitMQ Management: http://localhost:15672"
    echo "  - MinIO Console: http://localhost:9001"
    echo "  - MailHog: http://localhost:8025"
}

stop_services() {
    print_status "Deteniendo servicios de desarrollo..."
    docker-compose -f "$COMPOSE_FILE" down
    print_success "Servicios detenidos!"
}

restart_services() {
    print_status "Reiniciando servicios de desarrollo..."
    stop_services
    sleep 2
    start_services
}

show_logs() {
    if [ -n "$2" ]; then
        print_status "Mostrando logs para el servicio: $2"
        docker-compose -f "$COMPOSE_FILE" logs -f "$2"
    else
        print_status "Mostrando logs de todos los servicios..."
        docker-compose -f "$COMPOSE_FILE" logs -f
    fi
}

reset_environment() {
    print_warning "¿Estás seguro de que quieres resetear el entorno? Esto eliminará todos los datos. (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Reseteando entorno de desarrollo..."
        docker-compose -f "$COMPOSE_FILE" down -v
        docker system prune -f
        print_success "Entorno reseteado!"
        start_services
    else
        print_status "Operación cancelada."
    fi
}

run_migrations() {
    print_status "Ejecutando migraciones de base de datos..."
    
    # Check if backend is running in Docker
    if docker-compose -f "$COMPOSE_FILE" ps backend-dev | grep -q "Up"; then
        docker-compose -f "$COMPOSE_FILE" exec backend-dev pnpm run db:migrate
        docker-compose -f "$COMPOSE_FILE" exec backend-dev pnpm run db:seed
    else
        print_warning "Backend no está ejecutándose en Docker. Ejecuta las migraciones localmente:"
        echo "  pnpm run db:migrate"
        echo "  pnpm run db:seed"
    fi
}

show_help() {
    echo "ODA Platform - Script de Desarrollo Docker"
    echo ""
    echo "Uso: $0 [comando] [opciones]"
    echo ""
    echo "Comandos:"
    echo "  start     - Iniciar servicios de desarrollo"
    echo "  stop      - Detener servicios"
    echo "  restart   - Reiniciar servicios"
    echo "  logs      - Mostrar logs (opcional: especificar servicio)"
    echo "  reset     - Resetear entorno completo"
    echo "  migrate   - Ejecutar migraciones de BD"
    echo "  status    - Mostrar estado de servicios"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 start"
    echo "  $0 logs postgres"
    echo "  $0 reset"
}

show_status() {
    print_status "Estado de los servicios:"
    docker-compose -f "$COMPOSE_FILE" ps
}

# Main script logic
case "${1:-help}" in
    start)
        check_requirements
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        check_requirements
        restart_services
        ;;
    logs)
        show_logs "$@"
        ;;
    reset)
        check_requirements
        reset_environment
        ;;
    migrate)
        run_migrations
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Comando desconocido: $1"
        show_help
        exit 1
        ;;
esac
