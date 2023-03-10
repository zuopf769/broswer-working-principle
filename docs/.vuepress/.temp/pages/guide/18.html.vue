<template><h1 id="_18-宏任务和微任务-不是所有任务都是一个待遇" tabindex="-1"><a class="header-anchor" href="#_18-宏任务和微任务-不是所有任务都是一个待遇" aria-hidden="true">#</a> 18 | 宏任务和微任务：不是所有任务都是一个待遇</h1>
<p>在前面几篇文章中，我们介绍了消息队列，并结合消息队列介绍了两种典型的 WebAPI——<strong>setTimeout</strong> 和 <strong>XMLHttpRequest</strong>，通过这两个 WebAPI 我们搞清楚了浏览器的消息循环系统是怎么工作的。不过随着浏览器的应用领域越来越广泛，消息队列中这种粗时间颗粒度的任务已经不能胜任部分领域的需求，所以又出现了一种新的技术——<strong>微任务。微任务可以在实时性和效率之间做一个有效的权衡。</strong></p>
<p>从目前的情况来看，微任务已经被广泛地应用，基于微任务的技术有 MutationObserver、Promise 以及以 Promise 为基础开发出来的很多其他的技术。所以微任务的重要性也与日俱增，了解其底层的工作原理对于你读懂别人的代码，以及写出更高效、更具现代的代码有着决定性的作用。</p>
<p>有微任务，也就有宏任务，那这二者到底有什么区别？它们又是如何相互取长补短的？</p>
<h2 id="宏任务" tabindex="-1"><a class="header-anchor" href="#宏任务" aria-hidden="true">#</a> 宏任务</h2>
<p>前面我们已经介绍过了，页面中的大部分任务都是在主线程上执行的，这些任务包括了：</p>
<ul>
<li>
<p>渲染事件（如解析 DOM、计算布局、绘制）；</p>
</li>
<li>
<p>用户交互事件（如鼠标点击、滚动页面、放大缩小等）；</p>
</li>
<li>
<p>JavaScript 脚本执行事件；</p>
</li>
<li>
<p>网络请求完成、文件读写完成事件。</p>
</li>
</ul>
<p>为了协调这些任务有条不紊地在主线程上执行，页面进程引入了消息队列和事件循环机制，渲染进程内部会维护多个消息队列，比如延迟执行队列和普通的消息队列。然后主线程采用一个 for 循环，不断地从这些任务队列中取出任务并执行任务。我们把这些消息队列中的任务称为<strong>宏任务</strong>。</p>
<p>消息队列中的任务是通过事件循环系统来执行的，这里我们可以看看在WHATWG 规范中是怎么定义事件循环机制的。</p>
<p>由于规范需要支持语义上的完备性，所以通常写得都会比较啰嗦，这里我就大致总结了下 WHATWG 规范定义的大致流程：</p>
<ul>
<li>
<p>先从多个消息队列中选出一个最老的任务，这个任务称为 oldestTask；</p>
</li>
<li>
<p>然后循环系统记录任务开始执行的时间，并把这个 oldestTask 设置为当前正在执行的任务；</p>
</li>
<li>
<p>当任务执行完成之后，删除当前正在执行的任务，并从对应的消息队列中删除掉这个 oldestTask；</p>
</li>
<li>
<p>最后统计执行完成的时长等信息。</p>
</li>
</ul>
<p>以上就是消息队列中宏任务的执行过程，通过前面的学习，相信你也很熟悉这套执行流程了。</p>
<p>宏任务可以满足我们大部分的日常需求，不过如果有对时间精度要求较高的需求，宏任务就难以胜任了，下面我们就来分析下为什么宏任务难以满足对时间精度要求较高的任务。</p>
<p>前面我们说过，页面的渲染事件、各种 IO 的完成事件、执行 JavaScript 脚本的事件、用户交互的事件等都随时有可能被添加到消息队列中，而且添加事件是由系统操作的，JavaScript 代码不能准确掌控任务要添加到队列中的位置，控制不了任务在消息队列中的位置，所以很难控制开始执行任务的时间。为了直观理解，你可以看下面这段代码：</p>
<div class="language-html ext-html line-numbers-mode"><pre v-pre class="language-html"><code><span class="token doctype"><span class="token punctuation">&lt;!</span><span class="token doctype-tag">DOCTYPE</span> <span class="token name">html</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>html</span><span class="token punctuation">></span></span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>body</span><span class="token punctuation">></span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span> <span class="token attr-name">id</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">'</span>demo<span class="token punctuation">'</span></span><span class="token punctuation">></span></span>
            <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>ol</span><span class="token punctuation">></span></span>
                <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>li</span><span class="token punctuation">></span></span>test<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>li</span><span class="token punctuation">></span></span>
            <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>ol</span><span class="token punctuation">></span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">></span></span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>body</span><span class="token punctuation">></span></span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span> <span class="token attr-name">type</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>text/javascript<span class="token punctuation">"</span></span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
        <span class="token keyword">function</span> <span class="token function">timerCallback2</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
          console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token number">2</span><span class="token punctuation">)</span>
        <span class="token punctuation">}</span>
        <span class="token keyword">function</span> <span class="token function">timerCallback</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
            console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>
            <span class="token function">setTimeout</span><span class="token punctuation">(</span>timerCallback2<span class="token punctuation">,</span><span class="token number">0</span><span class="token punctuation">)</span>
        <span class="token punctuation">}</span>
        <span class="token function">setTimeout</span><span class="token punctuation">(</span>timerCallback<span class="token punctuation">,</span><span class="token number">0</span><span class="token punctuation">)</span>
    </span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>html</span><span class="token punctuation">></span></span>
</code></pre><div class="line-numbers" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br></div></div><p>在这段代码中，我的目的是想通过 setTimeout 来设置两个回调任务，并让它们按照前后顺序来执行，中间也不要再插入其他的任务，因为如果这两个任务的中间插入了其他的任务，就很有可能会影响到第二个定时器的执行时间了。</p>
<p>但实际情况是我们不能控制的，比如在你调用 setTimeout 来设置回调任务的间隙，消息队列中就有可能被插入很多系统级的任务。你可以打开 Performance 工具，来记录下这段任务的执行过程，也可参考文中我记录的图片：</p>
<p><img src="https://static001.geekbang.org/resource/image/3c/15/3c2b9b474c4df544df61ebd62a7b3715.png" alt="Performance 记录"></p>
<p>setTimeout 函数触发的回调函数都是宏任务，如图中，左右两个黄色块就是 setTimeout 触发的两个定时器任务。</p>
<p>现在你可以重点观察上图中间浅红色区域，这里有很多一段一段的任务，这些是被渲染引擎插在两个定时器任务中间的任务。试想一下，如果中间被插入的任务执行时间过久的话，那么就会影响到后面任务的执行了。</p>
<p>所以说宏任务的时间粒度比较大，执行的时间间隔是不能精确控制的，对一些高实时性的需求就不太符合了，比如后面要介绍的监听 DOM 变化的需求。</p>
<h2 id="微任务" tabindex="-1"><a class="header-anchor" href="#微任务" aria-hidden="true">#</a> 微任务</h2>
<p>在理解了宏任务之后，下面我们就可以来看看什么是微任务了。在<a href="/guide/17" target="_blank" rel="noopener noreferrer">上一篇文章<ExternalLinkIcon/></a>中，我们介绍过异步回调的概念，其主要有两种方式。</p>
<p><strong>第一种是把异步回调函数封装成一个宏任务，添加到消息队列尾部，当循环系统执行到该任务的时候执行回调函数</strong>。这种比较好理解，我们前面介绍的 setTimeout 和 XMLHttpRequest 的回调函数都是通过这种方式来实现的。</p>
<p><strong>第二种方式的执行时机是在主函数执行结束之后、当前宏任务结束之前执行回调函数，这通常都是以微任务形式体现的。</strong></p>
<p>那这里说的微任务到底是什么呢？</p>
<p><strong>微任务就是一个需要异步执行的函数，执行时机是在主函数执行结束之后、当前宏任务结束之前。</strong></p>
<p>不过要搞清楚微任务系统是怎么运转起来的，就得站在 V8 引擎的层面来分析下。</p>
<p>我们知道当 JavaScript 执行一段脚本的时候，V8 会为其创建一个全局执行上下文，在创建全局执行上下文的同时，V8 引擎也会在内部创建一个<strong>微任务队列</strong>。顾名思义，这个微任务队列就是用来存放微任务的，因为在当前宏任务执行的过程中，有时候会产生多个微任务，这时候就需要使用这个微任务队列来保存这些微任务了。不过这个微任务队列是给 V8 引擎内部使用的，所以你是无法通过 JavaScript 直接访问的。</p>
<p>也就是说每个宏任务都关联了一个微任务队列。那么接下来，我们就需要分析两个重要的时间点——微任务产生的时机和执行微任务队列的时机。</p>
<p>我们先来看看微任务是怎么产生的？在现代浏览器里面，产生微任务有两种方式。</p>
<p>第一种方式是使用 MutationObserver 监控某个 DOM 节点，然后再通过 JavaScript 来修改这个节点，或者为这个节点添加、删除部分子节点，当 DOM 节点发生变化时，就会产生 DOM 变化记录的微任务。</p>
<p>第二种方式是使用 Promise，当调用 Promise.resolve() 或者 Promise.reject() 的时候，也会产生微任务。</p>
<p>通过 DOM 节点变化产生的微任务或者使用 Promise 产生的微任务都会被 JavaScript 引擎按照顺序保存到微任务队列中。</p>
<p>好了，现在微任务队列中有了微任务了，那接下来就要看看微任务队列是何时被执行的。</p>
<p>通常情况下，在当前宏任务中的 JavaScript 快执行完成时，也就在 JavaScript 引擎准备退出全局执行上下文并清空调用栈的时候，JavaScript 引擎会检查全局执行上下文中的微任务队列，然后按照顺序执行队列中的微任务。<strong>WHATWG 把执行微任务的时间点称为检查点</strong>。当然除了在退出全局执行上下文式这个检查点之外，还有其他的检查点，不过不是太重要，这里就不做介绍了。</p>
<p>如果在执行微任务的过程中，产生了新的微任务，同样会将该微任务添加到微任务队列中，V8 引擎一直循环执行微任务队列中的任务，直到队列为空才算执行结束。也就是说在执行微任务过程中产生的新的微任务并不会推迟到下个宏任务中执行，而是在当前的宏任务中继续执行。</p>
<p>为了直观地理解什么是微任务，你可以参考下面我画的示意图（由于内容比较多，我将其分为了两张）：</p>
<p><img src="https://static001.geekbang.org/resource/image/83/88/839f468be3d683019c309e0acd8cd788.png" alt="微任务添加和执行流程示意图"></p>
<p>该示意图是在执行一个 ParseHTML 的宏任务，在执行过程中，遇到了 JavaScript 脚本，那么就暂停解析流程，进入到 JavaScript 的执行环境。从图中可以看到，全局上下文中包含了微任务列表。</p>
<p>在 JavaScript 脚本的后续执行过程中，分别通过 Promise 和 removeChild 创建了两个微任务，并被添加到微任务列表中。接着 JavaScript 执行结束，准备退出全局执行上下文，这时候就到了检查点了，JavaScript 引擎会检查微任务列表，发现微任务列表中有微任务，那么接下来，依次执行这两个微任务。等微任务队列清空之后，就退出全局执行上下文。</p>
<p>以上就是微任务的工作流程，从上面分析我们可以得出如下几个<strong>结论</strong>：</p>
<ul>
<li>
<p>微任务和宏任务是绑定的，每个宏任务在执行时，会创建自己的微任务队列。</p>
</li>
<li>
<p>微任务的执行时长会影响到当前宏任务的时长。比如一个宏任务在执行过程中，产生了 100 个微任务，执行每个微任务的时间是 10 毫秒，那么执行这 100 个微任务的时间就是 1000 毫秒，也可以说这 100 个微任务让宏任务的执行时间延长了 1000 毫秒。所以你在写代码的时候一定要注意控制微任务的执行时长。</p>
</li>
<li>
<p>在一个宏任务中，分别创建一个用于回调的宏任务和微任务，无论什么情况下，微任务都早于宏任务执行。</p>
</li>
</ul>
<h2 id="监听-dom-变化方法演变" tabindex="-1"><a class="header-anchor" href="#监听-dom-变化方法演变" aria-hidden="true">#</a> 监听 DOM 变化方法演变</h2>
<p>现在知道了微任务是怎么工作的，那接下来我们再来看看微任务是如何应用在 MutationObserver 中的。MutationObserver 是用来监听 DOM 变化的一套方法，而监听 DOM 变化一直是前端工程师一项非常核心的需求。</p>
<p>比如许多 Web 应用都利用 HTML 与 JavaScript 构建其自定义控件，与一些内置控件不同，这些控件不是固有的。为了与内置控件一起良好地工作，这些控件必须能够适应内容更改、响应事件和用户交互。因此，Web 应用需要<strong>监视 DOM 变化并及时地做出响应</strong>。</p>
<p>虽然监听 DOM 的需求是如此重要，不过早期页面并没有提供对监听的支持，所以那时要观察 DOM 是否变化，唯一能做的就是轮询检测，比如使用 setTimeout 或者 setInterval 来定时检测 DOM 是否有改变。这种方式简单粗暴，但是会遇到两个问题：如果时间间隔设置过长，DOM 变化响应不够及时；反过来如果时间间隔设置过短，又会浪费很多无用的工作量去检查 DOM，会让页面变得低效。</p>
<p>直到 2000 年的时候引入了 Mutation Event，Mutation Event 采用了<strong>观察者的设计模式</strong>，当 DOM 有变动时就会立刻触发相应的事件，这种方式属于同步回调。</p>
<p>采用 Mutation Event 解决了实时性的问题，因为 DOM 一旦发生变化，就会立即调用 JavaScript 接口。但也正是这种实时性造成了严重的性能问题，因为每次 DOM 变动，渲染引擎都会去调用 JavaScript，这样会产生较大的性能开销。比如利用 JavaScript 动态创建或动态修改 50 个节点内容，就会触发 50 次回调，而且每个回调函数都需要一定的执行时间，这里我们假设每次回调的执行时间是 4 毫秒，那么 50 次回调的执行时间就是 200 毫秒，若此时浏览器正在执行一个动画效果，由于 Mutation Event 触发回调事件，就会导致动画的卡顿。</p>
<p>也正是因为使用 Mutation Event 会导致页面性能问题，所以 Mutation Event 被反对使用，并逐步从 Web 标准事件中删除了。</p>
<p>为了解决了 Mutation Event 由于同步调用 JavaScript 而造成的性能问题，从 DOM4 开始，推荐使用 MutationObserver 来代替 Mutation Event。MutationObserver API 可以用来监视 DOM 的变化，包括属性的变化、节点的增减、内容的变化等。</p>
<p>那么相比较 Mutation Event，MutationObserver 到底做了哪些改进呢？</p>
<p>首先，MutationObserver 将响应函数改成异步调用，可以不用在每次 DOM 变化都触发异步调用，<strong>而是等多次 DOM 变化后，一次触发异步调用</strong>，并且还会使用一个数据结构来记录这期间所有的 DOM 变化。这样即使频繁地操纵 DOM，也不会对性能造成太大的影响。</p>
<p>我们通过异步调用和减少触发次数来缓解了性能问题，那么如何保持消息通知的及时性呢？如果采用 setTimeout 创建宏任务来触发回调的话，那么实时性就会大打折扣，因为上面我们分析过，在两个任务之间，可能会被渲染进程插入其他的事件，从而影响到响应的实时性。</p>
<p>这时候，<strong>微任务</strong>就可以上场了，在每次 DOM 节点发生变化的时候，渲染引擎将变化记录封装成微任务，并将微任务添加进当前的微任务队列中。这样当执行到检查点的时候，V8 引擎就会按照顺序执行微任务了。</p>
<p>综上所述， MutationObserver 采用了“<strong>异步 + 微任务</strong>”的策略。</p>
<p>通过<strong>异步</strong>操作解决了同步操作的<strong>性能问题</strong>；</p>
<p>通过<strong>微任务</strong>解决了<strong>实时性的问题</strong>。</p>
<h2 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> 总结</h2>
<p>好了，今天就介绍到这里，下面我来总结下今天的内容。</p>
<p>首先我们回顾了宏任务，然后在宏任务的基础之上，我们分析了异步回调函数的两种形式，其中最后一种回调的方式就是通过微任务来实现的。</p>
<p>接下来我们详细分析了浏览器是如何实现微任务的，包括微任务队列、检查点等概念。</p>
<p>最后我们介绍了监听 DOM 变化技术方案的演化史，从轮询到 Mutation Event 再到最新使用的 MutationObserver。MutationObserver 方案的核心就是采用了微任务机制，有效地权衡了实时性和执行效率的问题。</p>
<h2 id="思考时间" tabindex="-1"><a class="header-anchor" href="#思考时间" aria-hidden="true">#</a> 思考时间</h2>
<p>下篇文章我会从 Promise 产生的动机角度来分析 Promise，这需要一定的 Promise 基础，所以今天留给你的作业是搞清楚 Promise 的工作原理，弄清楚下面这段代码的输出结果，并解释其原因。</p>
<div class="language-javascript ext-js line-numbers-mode"><pre v-pre class="language-javascript"><code><span class="token keyword">function</span> <span class="token function">executor</span><span class="token punctuation">(</span><span class="token parameter">resolve<span class="token punctuation">,</span> reject</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">let</span> rand <span class="token operator">=</span> Math<span class="token punctuation">.</span><span class="token function">random</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>
    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>rand<span class="token punctuation">)</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>rand <span class="token operator">></span> <span class="token number">0.5</span><span class="token punctuation">)</span>
        <span class="token function">resolve</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token keyword">else</span>
        <span class="token function">reject</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token punctuation">}</span>
<span class="token keyword">var</span> p0 <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Promise</span><span class="token punctuation">(</span>executor<span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> p1 <span class="token operator">=</span> p0<span class="token punctuation">.</span><span class="token function">then</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">value</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span>
    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"succeed-1"</span><span class="token punctuation">)</span>
    <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">Promise</span><span class="token punctuation">(</span>executor<span class="token punctuation">)</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span>


<span class="token keyword">var</span> p3 <span class="token operator">=</span> p1<span class="token punctuation">.</span><span class="token function">then</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">value</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span>
    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"succeed-2"</span><span class="token punctuation">)</span>
    <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">Promise</span><span class="token punctuation">(</span>executor<span class="token punctuation">)</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span>

<span class="token keyword">var</span> p4 <span class="token operator">=</span> p3<span class="token punctuation">.</span><span class="token function">then</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">value</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span>
    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"succeed-3"</span><span class="token punctuation">)</span>
    <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">Promise</span><span class="token punctuation">(</span>executor<span class="token punctuation">)</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span>


p4<span class="token punctuation">.</span><span class="token function">catch</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">error</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span>
    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"error"</span><span class="token punctuation">)</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span>
console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token number">2</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br><span class="line-number">22</span><br><span class="line-number">23</span><br><span class="line-number">24</span><br><span class="line-number">25</span><br><span class="line-number">26</span><br><span class="line-number">27</span><br><span class="line-number">28</span><br><span class="line-number">29</span><br><span class="line-number">30</span><br><span class="line-number">31</span><br><span class="line-number">32</span><br></div></div><p>欢迎在留言区与我分享你的想法，也欢迎你在留言区记录你的思考过程。感谢阅读，如果你觉得这篇文章对你有帮助的话，也欢迎把它分享给更多的朋友。</p>
</template>
