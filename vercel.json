{
    "services": {
        "frontend": {
            "root": "frontend",
            "framework": "vite"
        },
        "backend": {
            "root": "backend"
        }
    },
    "rewrites": [
        {
            "source": "/api(/.*)?",
            "destination": {
                "type": "service",
                "service": "backend"
            }
        },
        {
            "source": "/(.*)",
            "destination": {
                "type": "service",
                "service": "frontend"
            }
        }
    ]
}
