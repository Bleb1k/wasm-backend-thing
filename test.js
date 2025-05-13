class Foo {
	a = []
	run() {
		console.log(this, this.a)
		this.a.push(1)
		return this
	}
}

try { console.log(Foo.run()) } catch {}

const Bar = new Proxy(Foo, {
	get: (a, b, c) => {
		const tmp = new a()
		return (..._) => (tmp[b](..._), tmp)
	}
})

console.log(Bar, Bar.run(), Bar.run().run())
