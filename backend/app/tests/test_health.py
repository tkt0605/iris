async def test_health(client):
    ac, _ =  client
    res = await ac.get('/health')
    assert res.status_code == 200
    assert res.json() == {
        "status": "OK"
    }

async def test_root(client):
    ac, _ = client
    res = await ac.get("/")
    assert res.status_code == 200
    assert res.json() == {
        "message": "Hello World !"
    }