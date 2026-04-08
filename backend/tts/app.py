# backend/tts/app.py
# Module D — TTS Flask API routes

from flask import Flask, request, jsonify, send_file, Response
from ..tts.generate import generate_tts, generate_preview, is_edge_tts_available
from ..tts.voice_list import get_voices, get_edge_voice_name

def create_tts_app() -> Flask:
    app = Flask(__name__)

    @app.route("/api/voices", methods=["GET"])
    def list_voices():
        """Return built-in edge-tts voice catalog."""
        locale = request.args.get("locale")
        gender = request.args.get("gender")
        voices = get_voices(locale=locale, gender=gender)
        return jsonify([{
            "id": v.id,
            "name": v.name,
            "edgeVoice": v.edge_voice,
            "gender": v.gender,
            "locale": v.locale,
            "description": v.description,
        } for v in voices])

    @app.route("/api/voices/<voice_id>/preview", methods=["GET"])
    def preview_voice(voice_id: str):
        """Generate and stream a 5-second preview MP3."""
        edge_voice = get_edge_voice_name(voice_id)
        if not edge_voice:
            return jsonify({"error": f"Unknown voice: {voice_id}"}), 404
        try:
            path = generate_preview(edge_voice)
            return send_file(path, mimetype="audio/mpeg", as_attachment=False)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/tts", methods=["POST"])
    def generate_tts_audio():
        """Generate TTS MP3 from text + voice."""
        data = request.get_json() or {}
        text = data.get("text", "").strip()
        voice_id = data.get("voice", "")

        if not text:
            return jsonify({"error": "text is required"}), 400

        edge_voice = get_edge_voice_name(voice_id)
        if not edge_voice:
            return jsonify({"error": f"Unknown voice: {voice_id}"}), 404

        try:
            path = generate_tts(text, edge_voice)
            return send_file(path, mimetype="audio/mpeg", as_attachment=True,
                           download_name=f"tts_{voice_id}.mp3")
        except Exception as e:
            return jsonify({"error": f"TTS generation failed: {e}"}), 500

    @app.route("/api/tts/health", methods=["GET"])
    def tts_health():
        """Check if edge-tts is available."""
        return jsonify({"available": is_edge_tts_available()})

    return app
