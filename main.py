# main.py
from flask import Flask
from app.controllers.meta_controller import meta_bp
from app.controllers.main_controller import main_bp
from app.utils.db import db

def create_app():
    """
    Crea y configura la aplicación Flask.
    """
    app = Flask(__name__, template_folder='app/templates', static_folder='app/static')
    app.config.from_object('config.Config')

    db.init_app(app)

    # Registrar blueprints
    app.register_blueprint(meta_bp, url_prefix='/api/metas') # API
    app.register_blueprint(main_bp) # Interfaz web

    with app.app_context():
        db.create_all()

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
