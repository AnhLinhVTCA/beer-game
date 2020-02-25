import "./index.css";
import {
  createGameLoop,
  resizeCanvas,
  createOrthoCamera,
  createBatch,
  drawPolygon,
  drawCircle,
  loadTexture
} from "gdxjs";
import {
  b2BodyDef,
  b2BodyType,
  b2Vec2,
  b2World,
  b2PolygonShape,
  b2ShapeType,
  b2CircleShape,
  b2Vec2_zero
} from "@flyover/box2d";
import createWhiteTexure from "gl-white-texture";

const init = async () => {
  const info = document.getElementById("info");
  const canvas = document.getElementById("main");
  const [width, height] = resizeCanvas(canvas, 1);
  const [worldWidth, worldHeight] = [10, 20];
  const gl = canvas.getContext("webgl");
  const camera = createOrthoCamera(worldWidth, worldHeight, width, height);
  const batch = createBatch(gl);
  const whiteText = createWhiteTexure(gl);
  const world = new b2World(new b2Vec2(0, 10));
  // const inputHandler = new InputHandler(canvas);
  const bg = await loadTexture(gl, "./bg.jpg");
  const bottle = await loadTexture(gl, "./bottle.png");
  const can1 = await loadTexture(gl, "./can-1.png");
  const can2 = await loadTexture(gl, "./can-2.png");
  const disk = await loadTexture(gl, "./disk.png");

  document.addEventListener("keydown", e => {
    if (e.which === 37 || e.which === 65) {
      console.log("left");
    } else if (e.which === 39 || e.which === 68) {
      console.log("right");
    }
  });

  const createBottle = (x, y, dynamic = true, density = 0.1) => {
    const bodyDef = new b2BodyDef();
    bodyDef.type = dynamic
      ? b2BodyType.b2_dynamicBody
      : b2BodyType.b2_staticBody;
    bodyDef.position = new b2Vec2(x, y);
    bodyDef.userData = {
      texure: bottle,
      width: 1,
      height: 5.5
    };
    const body = world.CreateBody(bodyDef);
    const shape = new b2PolygonShape();
    const shape1 = new b2PolygonShape();
    const shape2 = new b2PolygonShape();
    shape.SetAsBox(0.25, 0.3, new b2Vec2(0, -2.5));
    shape1.Set([
      new b2Vec2(-0.25, -2.2),
      new b2Vec2(0.25, -2.2),
      new b2Vec2(0.5, 0.75),
      new b2Vec2(-0.5, 0.75)
    ]);
    shape2.SetAsBox(0.5, 1, new b2Vec2(0, 1.75));
    body.CreateFixture(shape, density);
    body.CreateFixture(shape1, density);
    body.CreateFixture(shape2, density);
    return body;
  };

  const createCan = (x, y, w, h, dynamic = true, density = 1) => {
    const bodyDef = new b2BodyDef();
    bodyDef.type = dynamic
      ? b2BodyType.b2_dynamicBody
      : b2BodyType.b2_staticBody;
    bodyDef.position = new b2Vec2(x, y);
    bodyDef.userData = {
      texure: can2,
      width: 1,
      height: 2
    };
    const body = world.CreateBody(bodyDef);
    const shape = new b2PolygonShape();
    shape.SetAsBox(w / 2, h / 2);
    body.CreateFixture(shape, density);
    return body;
  };

  const createDisk = (x, y, w, h, density = 1) => {
    const bodyDef = new b2BodyDef();
    bodyDef.type = b2BodyType.b2_kinematicBody;
    bodyDef.position = new b2Vec2(x, y);
    bodyDef.userData = {
      texure: disk,
      width: 6,
      height: 0.5
    };
    const body = world.CreateBody(bodyDef);
    const shape = new b2PolygonShape();
    shape.SetAsBox(w / 2, h / 2);
    body.CreateFixture(shape, density);
    return body;
  };

  const createCircle = (x, y, r, impulseX, impulseY) => {
    const bodyDef = new b2BodyDef();
    bodyDef.type = b2BodyType.b2_dynamicBody;
    bodyDef.position = new b2Vec2(x, y);
    bodyDef.userData = {
      texure: can1
    };
    const body = world.CreateBody(bodyDef);
    const shape = new b2CircleShape(r);
    body.CreateFixture(shape, 1);
    body.ApplyLinearImpulse(new b2Vec2(impulseX, impulseY), b2Vec2_zero);
    return body;
  };

  createDisk(worldWidth / 2, 15, 6, 0.5);
  createBottle(5, 5);
  createCan(3, 5, 1, 2);
  createCircle(4.8, 1, 0.5, 0, 0);

  const tmp = [];

  gl.clearColor(0, 0, 0, 1);
  const update = delta => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    world.Step(delta, 8, 3);
    batch.setProjection(camera.combined);
    batch.begin();
    batch.draw(bg, 0, 0, worldWidth, worldHeight);
    for (let body = world.GetBodyList(); body; body = body.GetNext()) {
      const pos = body.GetPosition();
      for (
        let fixture = body.GetFixtureList();
        fixture;
        fixture = fixture.GetNext()
      ) {
        const data = body.GetUserData();
        const shape = fixture.GetShape();
        if (shape.GetType() === b2ShapeType.e_polygonShape) {
          const vertices = shape.m_vertices;
          tmp.length = 0;
          for (let vertice of vertices) {
            tmp.push(pos.x + vertice.x, pos.y + vertice.y);
          }
          drawPolygon(batch, whiteText, tmp, 0.1);
          batch.draw(
            data.texure,
            pos.x - data.width / 2,
            pos.y - data.height / 2,
            data.width,
            data.height,
            data.width / 2,
            data.height / 2,
            body.GetAngle()
          );
        } else if (shape.GetType() === b2ShapeType.e_circleShape) {
          drawCircle(batch, Text, pos.x, pos.y, shape.m_radius, 0.1);
          batch.draw(
            data.texure,
            pos.x - shape.m_radius,
            pos.y - shape.m_radius,
            shape.m_radius * 2,
            shape.m_radius * 2,
            shape.m_radius,
            shape.m_radius,
            body.GetAngle()
          );
        }
      }
    }
    batch.end();
  };

  const game = createGameLoop(update);
  setInterval(() => {
    info.innerHTML = `FPS : ${Math.round(game.getFps())}`;
  }, 1000);
};

init();
