# tests/test_api.py
import pytest
import json
from datetime import datetime, timedelta
from main import create_app
from app.utils.db import db

@pytest.fixture
def client():
    """
    Configura un cliente de prueba para la aplicación.
    """
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client

# tests/test_api.py
import pytest
import json
from datetime import datetime, timedelta
from main import create_app
from app.utils.db import db

@pytest.fixture
def client():
    """
    Configura un cliente de prueba para la aplicación.
    """
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client

def test_create_valid_meta(client):
    """
    Prueba la creación de una meta con datos válidos.
    """
    fecha_futura = (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d')
    data = {
        "division": "Andina",
        "proceso": "Flotación",
        "indicador": "Consumo Agua",
        "linea_base_anio": 2023,
        "valor_linea_base": 10.5,
        "unidad": "m3/ton",
        "fecha_objetivo": fecha_futura,
        "creado_por": "test@codelco.cl"
    }
    response = client.post('/api/metas/', data=json.dumps(data), content_type='application/json')
    assert response.status_code == 201
    assert response.json['division'] == "Andina"
    assert 'id' in response.json

def test_create_invalid_meta_past_date(client):
    """
    Prueba que no se puede crear una meta con una fecha objetivo en el pasado.
    """
    fecha_pasada = (datetime.now() - timedelta(days=10)).strftime('%Y-%m-%d')
    data = {
        "division": "El Teniente",
        "proceso": "Fundición",
        "indicador": "Emisiones SO2",
        "linea_base_anio": 2021,
        "valor_linea_base": 5.2,
        "fecha_objetivo": fecha_pasada,
        "creado_por": "test@codelco.cl"
    }
    response = client.post('/api/metas/', data=json.dumps(data), content_type='application/json')
    assert response.status_code == 400
    assert 'fecha_objetivo' in response.json

def test_create_invalid_meta_missing_field(client):
    """
    Prueba que no se puede crear una meta si falta un campo obligatorio.
    """
    fecha_futura = (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d')
    data = {
        # Falta 'division'
        "proceso": "Transporte",
        "indicador": "Consumo Diesel",
        "linea_base_anio": 2022,
        "valor_linea_base": 100.0,
        "fecha_objetivo": fecha_futura,
        "creado_por": "test@codelco.cl"
    }
    response = client.post('/api/metas/', data=json.dumps(data), content_type='application/json')
    assert response.status_code == 400
    assert 'division' in response.json


def test_create_invalid_meta_past_date(client):
    """
    Prueba que no se puede crear una meta con una fecha objetivo en el pasado.
    """
    fecha_pasada = (datetime.now() - timedelta(days=10)).strftime('%Y-%m-%d')
    data = {
        "division": "El Teniente",
        "proceso": "Fundición",
        "indicador": "Emisiones SO2",
        "linea_base_anio": 2021,
        "valor_linea_base": 5.2,
        "fecha_objetivo": fecha_pasada,
        "creado_por": "test@codelco.cl"
    }
    response = client.post('/metas/', data=json.dumps(data), content_type='application/json')
    assert response.status_code == 400
    assert 'fecha_objetivo' in response.json

def test_create_invalid_meta_missing_field(client):
    """
    Prueba que no se puede crear una meta si falta un campo obligatorio.
    """
    fecha_futura = (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d')
    data = {
        # Falta 'division'
        "proceso": "Transporte",
        "indicador": "Consumo Diesel",
        "linea_base_anio": 2022,
        "valor_linea_base": 100.0,
        "fecha_objetivo": fecha_futura,
        "creado_por": "test@codelco.cl"
    }
    response = client.post('/metas/', data=json.dumps(data), content_type='application/json')
    assert response.status_code == 400
    assert 'division' in response.json
