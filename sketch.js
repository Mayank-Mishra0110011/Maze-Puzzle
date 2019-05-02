
let walls = [], ray, particle, cols, rows, grid = [], w = 40, current, stack = [];

function setup() {
    createCanvas(640, 640);
    cols = floor(width / w);
    rows = floor(height / w);
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            grid.push(new Cell(i, j));
        }
    }
    current = grid[0];
}

function draw() {
    background(0);
    for (let i = 0; i < grid.length; i++) {
        grid[i].show();
    }
    if (!Cell.ready) {
        current.visited = true;
        let next = current.checkNeighbors();
        if (next) {
            next.visited = true;
            stack.push(current)
            removeWalls(current, next);
            current = next;
        }
        else
        if (stack.length > 0) {
            current = stack.pop();
        }
        if (current.i == 0 && current.j == 0) {
            Cell.ready = true;
            Cell.initWalls();
        }
    }
    else {
        for (let wall of walls) {
            wall.show();
        }
        particle.show();
        particle.look(walls);
        particle.update();
    }
}

function removeWalls(a, b) {
    let x = a.i - b.i;
    if (x === 1) {
        a.walls[3] = false;
        b.walls[1] = false;
    }
    else
    if (x === -1) {
        a.walls[1] = false;
        b.walls[3] = false;
    }
    let y = a.j - b.j;
    if (y === 1) {
        a.walls[0] = false;
        b.walls[2] = false;
    }
    else
    if (y === -1) {
        a.walls[2] = false;
        b.walls[0] = false;
    }
}

function index(i, j) {
    if (i < 0 || j < 0 || i > rows - 1 || j > cols - 1) {
        return -1;
    }
    return i + j * cols;
}

class Cell {
    static ready = false;
    constructor(i, j) {
        this.i = i;
        this.j = j;
        this.walls = [true, true, true, true];
        this.visited = false;
    }
    static initWalls() {
        grid.forEach(cell => {
            let x = cell.i * w;
            let y = cell.j * w;
            if (cell.walls[0]) {
                walls.push(new Boundary(x, y, x + w, y));
            }
            if (cell.walls[1]) {
                walls.push(new Boundary(x + w, y, x + w, y + w));
            }
            if (cell.walls[2]) {
                walls.push(new Boundary(x + w, y + w, x, y + w));
            }
            if (cell.walls[3]) {
                walls.push(new Boundary(x, y + w, x, y));
            }
        });
        grid = [];
        particle = new Particle();
    }
    checkNeighbors() {
        let neighbors = [];
        let top = grid[index(this.i, this.j - 1)];
        let right = grid[index(this.i + 1, this.j)];
        let bottom = grid[index(this.i, this.j + 1)];
        let left = grid[index(this.i - 1, this.j)];
        if (top && !top.visited) {
            neighbors.push(top);
        }
        if (right && !right.visited) {
            neighbors.push(right);
        }
        if (bottom && !bottom.visited) {
            neighbors.push(bottom);
        }
        if (left && !left.visited) {
            neighbors.push(left);
        }
        if (neighbors.length > 0) {
            let r = floor(random(0, neighbors.length));
            return neighbors[r];
        }
        else {
            return undefined;
        }
    }
    show() {
        let x = this.i * w;
        let y = this.j * w;
        stroke(255);
        if (this.walls[0]) {
            line(x, y, x + w, y);
        }
        if (this.walls[1]) {
            line(x + w, y, x + w, y + w);
        }
        if (this.walls[2]) {
            line(x + w, y + w, x, y + w);
        }
        if (this.walls[3]) {
            line(x, y + w, x, y);
        }
    }
}

class Ray {
    constructor(pos, angle) {
        this.pos = pos;
        this.dir = p5.Vector.fromAngle(angle);
    }
    lookAt(x, y) {
        this.dir.x = x - this.pos.x;
        this.dir.y = y - this.pos.y;
        this.dir.normalize();
    }
    show(col) {
        if (col) {
            stroke(col);    
        }
        else {
            stroke(255, 255, 0, 100);
        }
        push();
        translate(this.pos.x, this.pos.y);
        line(0, 0, this.dir.x * 10, this.dir.y * 10);
        pop();
    }
    cast(wall) {
        let x1 = wall.a.x;
        let x2 = wall.b.x;
        let x3 = this.pos.x;
        let x4 = this.pos.x + this.dir.x;
        let y1 = wall.a.y;
        let y2 = wall.b.y;
        let y3 = this.pos.y;
        let y4 = this.pos.y + this.dir.y;
        let denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denom == 0) {
            return;
        }
        let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
		let u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        if (t > 0 && t < 1 && u > 0) {
            return createVector((x1 + t * (x2 - x1)), (y1 + t * (y2- y1)));
        }
        else {
            return;
        }
    }
}

class Boundary {
    constructor(x1, y1, x2, y2) {
        this.a = createVector(x1, y1);
        this.b = createVector(x2, y2);
    }
    show() {
        stroke(255);
        line(this.a.x, this.a.y, this.b.x, this.b.y);
    }
}

class Particle {
    constructor() {
        this.pos = createVector(10, 10);
        this.rays = [];
        for (let i = 0; i < 360; i += .5) {
            this.rays.push(new Ray(this.pos, radians(i)));
        }
    }
    look() {
        for (let ray of this.rays) {
            let closest = null;
            let record = Infinity;
            for (let wall of walls) {
                let pt = ray.cast(wall);
                if (pt) {
                    let d = p5.Vector.dist(this.pos, pt);
                    if (d < record) {
                        record = d;
                        closest = pt;
                    }
                }
            }
            if (closest) {
                line(this.pos.x, this.pos.y, closest.x, closest.y);
            }
        }
    }
    show() {
        for (let ray of this.rays) {
            ray.show();
        }
    }
    update() {
        if (key === 'w' && isConstrained('w')) {
            this.pos.y -= 5;
        }
        else
        if (key === 'a' && isConstrained('a')) {
            this.pos.x -= 5;
        } 
        else 
        if (key === 's' && isConstrained('s')) {
                this.pos.y += 5;
        }
        else 
        if (key === 'd' && isConstrained('d')) {
            this.pos.x += 5;
        }
        isConstrained('d');
    }
}

function isConstrained(dir) {
    let directionalRays = [
        new Ray(particle.pos, radians(0)),
        new Ray(particle.pos, radians(90)),
        new Ray(particle.pos, radians(180)),
        new Ray(particle.pos, radians(270)),
    ];
    directionalRays.forEach(ray => {
        ray.show(color(255, 255, 255));
    });
    let closest = null;
    let record = Infinity;    
    if (dir === 'd') {
        for (let wall of walls) {
            let pt = directionalRays[0].cast(wall);
            if (pt) {
                let d = p5.Vector.dist(particle.pos, pt);
                if (d < record) {
                    record = d;
                    closest = pt;
                }
            }
        }
        if (closest) {
            if (particle.pos.x + directionalRays[0].dir.x * 10 >= closest.x) {
                return false;
            }
        }
        else {
            return false;
        }
    }
    else 
    if (dir === 'a') {
        for (let wall of walls) {
            let pt = directionalRays[2].cast(wall);
            if (pt) {
                let d = p5.Vector.dist(particle.pos, pt);
                if (d < record) {
                    record = d;
                    closest = pt;
                }
            }
        }
        if (closest) {
            if (particle.pos.x + directionalRays[2].dir.x * 10 <= closest.x) {
                return false;
            }
        }
        else {
            return false;
        }
    }
    else 
    if (dir === 's') {
        for (let wall of walls) {
            let pt = directionalRays[1].cast(wall);
            if (pt) {
                let d = p5.Vector.dist(particle.pos, pt);
                if (d < record) {
                    record = d;
                    closest = pt;
                }
            }
        }
        if (closest) {
            if (particle.pos.y + directionalRays[1].dir.y * 10 >= closest.y) {
                return false;
            }
        }
        else {
            return false;
        }
    }
    else 
    if (dir === 'w') {
        for (let wall of walls) {
            let pt = directionalRays[3].cast(wall);
            if (pt) {
                let d = p5.Vector.dist(particle.pos, pt);
                if (d < record) {
                    record = d;
                    closest = pt;
                }
            }
        }
        if (closest) {
            if (particle.pos.y + directionalRays[3].dir.y * 10 <= closest.y) {
                return false;
            }
        }
        else {
            return false;
        }
    }
    return true;
}
