FROM python:3.12-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        pkg-config \
        curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


RUN curl -LsSf https://astral.sh/uv/install.sh | sh && \
    mv /root/.local/bin/uv /usr/local/bin/uv

WORKDIR /workspaces/backend

COPY requirements.txt ./
RUN  uv run pip3 install --upgrade pip && \
        uv run pip3 install --no-cache -r requirements.txt

CMD [ "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000" ]