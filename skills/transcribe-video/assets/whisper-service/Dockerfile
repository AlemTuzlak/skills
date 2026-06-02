# --- Build stage ------------------------------------------------------------
FROM python:3.11-slim AS build

ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    git build-essential cmake ffmpeg ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /src
RUN git clone --depth=1 https://github.com/ggerganov/whisper.cpp.git
WORKDIR /src/whisper.cpp

# Build with CMake and INSTALL to /usr/local (puts bin + libs in place)
RUN cmake -S . -B build -DCMAKE_BUILD_TYPE=Release \
 && cmake --build build -j \
 && cmake --install build --prefix /usr/local

# --- Runtime stage ----------------------------------------------------------
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Copy installed binaries and libraries (includes libwhisper.so.*)
COPY --from=build /usr/local /usr/local

# Python API
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .

# Model + runtime config
ENV MODELS_DIR=/models
ENV WHISPER_MODEL=base.en
ENV WHISPER_THREADS=4
ENV WHISPER_BEAM_SIZE=5
ENV WHISPER_BIN=whisper-cli
# ensure the loader can see /usr/local/lib (usually not needed, but safe)
ENV LD_LIBRARY_PATH=/usr/local/lib

# Download the Whisper model during build
RUN mkdir -p /models && \
    pip install --no-cache-dir huggingface_hub && \
    python -c "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='ggerganov/whisper.cpp', filename='ggml-base.en.bin', local_dir='/models', local_dir_use_symlinks=False)" && \
    pip uninstall -y huggingface_hub

EXPOSE 9001
CMD ["uvicorn","app:api","--host","0.0.0.0","--port","9001"]
