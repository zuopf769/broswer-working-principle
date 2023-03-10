<template><h1 id="_17-webapi-xmlhttprequest是怎么实现的" tabindex="-1"><a class="header-anchor" href="#_17-webapi-xmlhttprequest是怎么实现的" aria-hidden="true">#</a> 17 | WebAPI：XMLHttpRequest是怎么实现的？</h1>
<p>在<a href="/guide/16" target="_blank" rel="noopener noreferrer">上一篇文章<ExternalLinkIcon/></a>中我们介绍了 setTimeout 是如何结合渲染进程的循环系统工作的，那本篇文章我们就继续介绍另外一种类型的 WebAPI——XMLHttpRequest。</p>
<p>自从网页中引入了 JavaScript，我们就可以操作 DOM 树中任意一个节点，例如隐藏 / 显示节点、改变颜色、获得或改变文本内容、为元素添加事件响应函数等等， 几乎可以“为所欲为”了。</p>
<p>不过在 XMLHttpRequest 出现之前，如果服务器数据有更新，依然需要重新刷新整个页面。而 XMLHttpRequest 提供了从 Web 服务器获取数据的能力，如果你想要更新某条数据，只需要通过 XMLHttpRequest 请求服务器提供的接口，就可以获取到服务器的数据，然后再操作 DOM 来更新页面内容，整个过程只需要更新网页的一部分就可以了，而不用像之前那样还得刷新整个页面，这样既有效率又不会打扰到用户。</p>
<p>关于 XMLHttpRequest，本来我是想一带而过的，后来发现这个 WebAPI 用于教学非常好。首先前面讲了那么网络内容，现在可以通过它把 HTTP 协议实践一遍；其次，XMLHttpRequest 是一个非常典型的 WebAPI，通过它来讲解浏览器是如何实现 WebAPI 的很合适，这对于你理解其他 WebAPI 也有非常大的帮助，同时在这个过程中我们还可以把一些安全问题给串起来。</p>
<p>但在深入讲解 XMLHttpRequest 之前，我们得先介绍下<strong>同步回调</strong>和<strong>异步回调</strong>这两个概念，这会帮助你更加深刻地理解 WebAPI 是怎么工作的。</p>
<h2 id="回调函数-vs-系统调用栈" tabindex="-1"><a class="header-anchor" href="#回调函数-vs-系统调用栈" aria-hidden="true">#</a> 回调函数 VS 系统调用栈</h2>
<p>那什么是回调函数呢（Callback Function）？</p>
<p>将一个函数作为参数传递给另外一个函数，那作为参数的这个函数就是<strong>回调函数</strong>。简化的代码如下所示：</p>
<div class="language-javascript ext-js line-numbers-mode"><pre v-pre class="language-javascript"><code><span class="token keyword">let</span> <span class="token function-variable function">callback</span> <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'i am do homework'</span><span class="token punctuation">)</span>
<span class="token punctuation">}</span>

<span class="token keyword">function</span> <span class="token function">doWork</span><span class="token punctuation">(</span><span class="token parameter">cb</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'start do work'</span><span class="token punctuation">)</span>
  <span class="token function">cb</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'end do work'</span><span class="token punctuation">)</span>
<span class="token punctuation">}</span>

<span class="token function">doWork</span><span class="token punctuation">(</span>callback<span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br></div></div><p>在上面示例代码中，我们将一个匿名函数赋值给变量 callback，同时将 callback 作为参数传递给了 doWork() 函数，这时在函数 doWork() 中 callback 就是回调函数。</p>
<p>上面的回调方法有个特点，就是回调函数 callback 是在主函数 doWork 返回之前执行的，我们把这个回调过程称为<strong>同步回调</strong>。</p>
<p>既然有同步回调，那肯定也有异步回调。下面我们再来看看异步回调的例子：</p>
<div class="language-javascript ext-js line-numbers-mode"><pre v-pre class="language-javascript"><code><span class="token keyword">let</span> <span class="token function-variable function">callback</span> <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'i am do homework'</span><span class="token punctuation">)</span>
<span class="token punctuation">}</span>

<span class="token keyword">function</span> <span class="token function">doWork</span><span class="token punctuation">(</span><span class="token parameter">cb</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'start do work'</span><span class="token punctuation">)</span>
  <span class="token function">setTimeout</span><span class="token punctuation">(</span>cb<span class="token punctuation">,</span><span class="token number">1000</span><span class="token punctuation">)</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'end do work'</span><span class="token punctuation">)</span>
<span class="token punctuation">}</span>
<span class="token function">doWork</span><span class="token punctuation">(</span>callback<span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br></div></div><p>在这个例子中，我们使用了 setTimeout 函数让 callback 在 doWork 函数执行结束后，又延时了 1 秒再执行，这次 callback 并没有在主函数 doWork 内部被调用，我们把这种回调函数在主函数外部执行的过程称为<strong>异步回调</strong>。</p>
<p>现在你应该知道什么是同步回调和异步回调了，那下面我们再深入点，站在消息循环的视角来看看同步回调和异步回调的区别。理解了这些，可以让你从本质上理解什么是回调。</p>
<p>我们还是先来回顾下页面的事件循环系统，通过<a href="/guide/15" target="_blank" rel="noopener noreferrer">《15 | 消息队列和事件循环：页面是怎么“活”起来的？》<ExternalLinkIcon/></a>的学习，你应该已经知道浏览器页面是通过事件循环机制来驱动的，每个渲染进程都有一个消息队列，页面主线程按照顺序来执行消息队列中的事件，如执行 JavaScript 事件、解析 DOM 事件、计算布局事件、用户输入事件等等，如果页面有新的事件产生，那新的事件将会追加到事件队列的尾部。所以可以说是<strong>消息队列和主线程循环机制保证了页面有条不紊地运行</strong>。</p>
<p>这里还需要补充一点，那就是当循环系统在执行一个任务的时候，都要为这个任务维护一个<strong>系统调用栈</strong>。这个<strong>系统调用栈</strong>类似于 JavaScript 的调用栈，只不过系统调用栈是 Chromium 的开发语言 C++ 来维护的，其完整的调用栈信息你可以通过 chrome://tracing/ 来抓取。当然，你也可以通过 Performance 来抓取它核心的调用信息，如下图所示：</p>
<p><img src="https://static001.geekbang.org/resource/image/d3/77/d3d66afb1a103103e5c3f86c823efb77.png" alt="消息循环系统调用栈记录"></p>
<p>这幅图记录了一个 Parse HTML 的任务执行过程，其中黄色的条目表示执行 JavaScript 的过程，其他颜色的条目表示浏览器内部系统的执行过程。</p>
<p>通过该图你可以看出来，Parse HTML 任务在执行过程中会遇到一系列的子过程，比如在解析页面的过程中遇到了 JavaScript 脚本，那么就暂停解析过程去执行该脚本，等执行完成之后，再恢复解析过程。然后又遇到了样式表，这时候又开始解析样式表……直到整个任务执行完成。</p>
<p>需要说明的是，整个 Parse HTML 是一个完整的任务，在执行过程中的脚本解析、样式表解析都是该任务的子过程，其下拉的长条就是执行过程中调用栈的信息。</p>
<p>每个任务在执行过程中都有自己的调用栈，那么同步回调就是在当前主函数的上下文中执行回调函数，这个没有太多可讲的。下面我们主要来看看异步回调过程，异步回调是指回调函数在主函数之外执行，一般有两种方式：</p>
<ul>
<li>
<p>第一种是把异步函数做成一个任务，添加到信息队列尾部；</p>
</li>
<li>
<p>第二种是把异步函数添加到微任务队列中，这样就可以在当前任务的末尾处执行微任务了。</p>
</li>
</ul>
<h2 id="xmlhttprequest-运作机制" tabindex="-1"><a class="header-anchor" href="#xmlhttprequest-运作机制" aria-hidden="true">#</a> XMLHttpRequest 运作机制</h2>
<p>理解了什么是同步回调和异步回调，接下来我们就来分析 XMLHttpRequest 背后的实现机制，具体工作过程你可以参考下图：</p>
<p><img src="https://static001.geekbang.org/resource/image/29/c6/2914a052f4f249a52077692a22ee5cc6.png" alt="XMLHttpRequest 工作流程图"></p>
<p>这是 XMLHttpRequest 的总执行流程图，下面我们就来分析从发起请求到接收数据的完整流程。</p>
<p>我们先从 XMLHttpRequest 的用法开始，首先看下面这样一段请求代码：</p>
<div class="language-javascript ext-js line-numbers-mode"><pre v-pre class="language-javascript"><code> <span class="token keyword">function</span> <span class="token function">GetWebData</span><span class="token punctuation">(</span><span class="token parameter"><span class="token constant">URL</span></span><span class="token punctuation">)</span><span class="token punctuation">{</span>
    <span class="token doc-comment comment">/**
     * 1:新建XMLHttpRequest请求对象
     */</span>
    <span class="token keyword">let</span> xhr <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">XMLHttpRequest</span><span class="token punctuation">(</span><span class="token punctuation">)</span>

    <span class="token doc-comment comment">/**
     * 2:注册相关事件回调处理函数 
     */</span>
    xhr<span class="token punctuation">.</span><span class="token function-variable function">onreadystatechange</span> <span class="token operator">=</span> <span class="token keyword">function</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">switch</span><span class="token punctuation">(</span>xhr<span class="token punctuation">.</span>readyState<span class="token punctuation">)</span><span class="token punctuation">{</span>
          <span class="token keyword">case</span> <span class="token number">0</span><span class="token operator">:</span> <span class="token comment">//请求未初始化</span>
            console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"请求未初始化"</span><span class="token punctuation">)</span>
            <span class="token keyword">break</span><span class="token punctuation">;</span>
          <span class="token keyword">case</span> <span class="token number">1</span><span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span><span class="token constant">OPENED</span>
            console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"OPENED"</span><span class="token punctuation">)</span>
            <span class="token keyword">break</span><span class="token punctuation">;</span>
          <span class="token keyword">case</span> <span class="token number">2</span><span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span><span class="token constant">HEADERS_RECEIVED</span>
            console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"HEADERS_RECEIVED"</span><span class="token punctuation">)</span>
            <span class="token keyword">break</span><span class="token punctuation">;</span>
          <span class="token keyword">case</span> <span class="token number">3</span><span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span><span class="token constant">LOADING</span>  
            console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"LOADING"</span><span class="token punctuation">)</span>
            <span class="token keyword">break</span><span class="token punctuation">;</span>
          <span class="token keyword">case</span> <span class="token number">4</span><span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span><span class="token constant">DONE</span>
            <span class="token keyword">if</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>status <span class="token operator">==</span> <span class="token number">200</span><span class="token operator">||</span><span class="token keyword">this</span><span class="token punctuation">.</span>status <span class="token operator">==</span> <span class="token number">304</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
                console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>responseText<span class="token punctuation">)</span><span class="token punctuation">;</span>
                <span class="token punctuation">}</span>
            console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"DONE"</span><span class="token punctuation">)</span>
            <span class="token keyword">break</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

    xhr<span class="token punctuation">.</span><span class="token function-variable function">ontimeout</span> <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token parameter">e</span><span class="token punctuation">)</span> <span class="token punctuation">{</span> console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'ontimeout'</span><span class="token punctuation">)</span> <span class="token punctuation">}</span>
    xhr<span class="token punctuation">.</span><span class="token function-variable function">onerror</span> <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token parameter">e</span><span class="token punctuation">)</span> <span class="token punctuation">{</span> console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'onerror'</span><span class="token punctuation">)</span> <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 3:打开请求
     */</span>
    xhr<span class="token punctuation">.</span><span class="token function">open</span><span class="token punctuation">(</span><span class="token string">'Get'</span><span class="token punctuation">,</span> <span class="token constant">URL</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">;</span><span class="token comment">//创建一个Get请求,采用异步</span>


    <span class="token doc-comment comment">/**
     * 4:配置参数
     */</span>
    xhr<span class="token punctuation">.</span>timeout <span class="token operator">=</span> <span class="token number">3000</span> <span class="token comment">//设置xhr请求的超时时间</span>
    xhr<span class="token punctuation">.</span>responseType <span class="token operator">=</span> <span class="token string">"text"</span> <span class="token comment">//设置响应返回的数据格式</span>
    xhr<span class="token punctuation">.</span><span class="token function">setRequestHeader</span><span class="token punctuation">(</span><span class="token string">"X_TEST"</span><span class="token punctuation">,</span><span class="token string">"time.geekbang"</span><span class="token punctuation">)</span>

    <span class="token doc-comment comment">/**
     * 5:发送请求
     */</span>
    xhr<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br><span class="line-number">22</span><br><span class="line-number">23</span><br><span class="line-number">24</span><br><span class="line-number">25</span><br><span class="line-number">26</span><br><span class="line-number">27</span><br><span class="line-number">28</span><br><span class="line-number">29</span><br><span class="line-number">30</span><br><span class="line-number">31</span><br><span class="line-number">32</span><br><span class="line-number">33</span><br><span class="line-number">34</span><br><span class="line-number">35</span><br><span class="line-number">36</span><br><span class="line-number">37</span><br><span class="line-number">38</span><br><span class="line-number">39</span><br><span class="line-number">40</span><br><span class="line-number">41</span><br><span class="line-number">42</span><br><span class="line-number">43</span><br><span class="line-number">44</span><br><span class="line-number">45</span><br><span class="line-number">46</span><br><span class="line-number">47</span><br><span class="line-number">48</span><br><span class="line-number">49</span><br><span class="line-number">50</span><br><span class="line-number">51</span><br><span class="line-number">52</span><br><span class="line-number">53</span><br></div></div><p>上面是一段利用了 XMLHttpRequest 来请求数据的代码，再结合上面的流程图，我们可以分析下这段代码是怎么执行的。</p>
<p><strong>第一步：创建 XMLHttpRequest 对象。</strong></p>
<p>当执行到let xhr = new XMLHttpRequest()后，JavaScript 会创建一个 XMLHttpRequest 对象 xhr，用来执行实际的网络请求操作。</p>
<p><strong>第二步：为 xhr 对象注册回调函数。</strong></p>
<p>因为网络请求比较耗时，所以要注册回调函数，这样后台任务执行完成之后就会通过调用回调函数来告诉其执行结果。</p>
<p>XMLHttpRequest 的回调函数主要有下面几种：</p>
<ul>
<li>
<p>ontimeout，用来监控超时请求，如果后台请求超时了，该函数会被调用；</p>
</li>
<li>
<p>onerror，用来监控出错信息，如果后台请求出错了，该函数会被调用；</p>
</li>
<li>
<p>onreadystatechange，用来监控后台请求过程中的状态，比如可以监控到 HTTP 头加载完成的消息、HTTP 响应体消息以及数据加载完成的消息等。</p>
</li>
</ul>
<p><strong>第三步：配置基础的请求信息。</strong></p>
<p>注册好回调事件之后，接下来就需要配置基础的请求信息了，首先要通过 open 接口配置一些基础的请求信息，包括请求的地址、请求方法（是 get 还是 post）和请求方式（同步还是异步请求）。</p>
<p>然后通过 xhr 内部属性类配置一些其他可选的请求信息，你可以参考文中示例代码，我们通过xhr.timeout = 3000来配置超时时间，也就是说如果请求超过 3000 毫秒还没有响应，那么这次请求就被判断为失败了。</p>
<p>我们还可以通过xhr.responseType = &quot;text&quot;来配置服务器返回的格式，将服务器返回的数据自动转换为自己想要的格式，如果将 responseType 的值设置为 json，那么系统会自动将服务器返回的数据转换为 JavaScript 对象格式。下面的图表是我列出的一些返回类型的描述：</p>
<p><img src="https://static001.geekbang.org/resource/image/85/bf/856d1965676fafa46122e3ad1235dfbf.png" alt="返回类型描述"></p>
<p>假如你还需要添加自己专用的请求头属性，可以通过 xhr.setRequestHeader 来添加。</p>
<p><strong>第四步：发起请求。</strong></p>
<p>一切准备就绪之后，就可以调用xhr.send来发起网络请求了。你可以对照上面那张请求流程图，可以看到：渲染进程会将请求发送给网络进程，然后网络进程负责资源的下载，等网络进程接收到数据之后，就会利用 IPC 来通知渲染进程；渲染进程接收到消息之后，会将 xhr 的回调函数封装成任务并添加到消息队列中，等主线程循环系统执行到该任务的时候，就会根据相关的状态来调用对应的回调函数。</p>
<ul>
<li>
<p>如果网络请求出错了，就会执行 xhr.onerror；</p>
</li>
<li>
<p>如果超时了，就会执行 xhr.ontimeout；</p>
</li>
<li>
<p>如果是正常的数据接收，就会执行 onreadystatechange 来反馈相应的状态。</p>
</li>
</ul>
<p>这就是一个完整的 XMLHttpRequest 请求流程，如果你感兴趣，可以参考下 Chromium 对 XMLHttpRequest 的实现，<a href="https://chromium.googlesource.com/chromium/src/+/refs/heads/master/third_party/blink/renderer/core/xmlhttprequest/" target="_blank" rel="noopener noreferrer">点击这里查看代码<ExternalLinkIcon/></a>。</p>
<h2 id="xmlhttprequest-使用过程中的-坑" tabindex="-1"><a class="header-anchor" href="#xmlhttprequest-使用过程中的-坑" aria-hidden="true">#</a> XMLHttpRequest 使用过程中的“坑”</h2>
<p>上述过程看似简单，但由于浏览器很多安全策略的限制，所以会导致你在使用过程中踩到非常多的“坑”。</p>
<p>浏览器安全问题是前端工程师避不开的一道坎，通常在使用过程中遇到的“坑”，很大一部分都是由安全策略引起的，不管你喜不喜欢，它都在这里。本来很完美的一个方案，正是由于加了安全限制，导致使用起来非常麻烦。</p>
<p>而你要做的就是去正视这各种的安全问题。也就是说要想更加完美地使用 XMLHttpRequest，你就要了解浏览器的安全策略。</p>
<p>下面我们就来看看在使用 XMLHttpRequest 的过程中所遇到的跨域问题和混合内容问题。</p>
<h3 id="_1-跨域问题" tabindex="-1"><a class="header-anchor" href="#_1-跨域问题" aria-hidden="true">#</a> 1. 跨域问题</h3>
<p>比如在极客邦的官网使用 XMLHttpRequest 请求极客时间的页面内容，由于极客邦的官网是www.geekbang.org，极客时间的官网是time.geekbang.org，它们不是同一个源，所以就涉及到了跨域（在 A 站点中去访问不同源的 B 站点的内容）。默认情况下，跨域请求是不被允许的，你可以看下面的示例代码：</p>
<div class="language-javascript ext-js line-numbers-mode"><pre v-pre class="language-javascript"><code><span class="token keyword">var</span> xhr <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">XMLHttpRequest</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token keyword">var</span> url <span class="token operator">=</span> <span class="token string">'https://time.geekbang.org/'</span>
<span class="token keyword">function</span> <span class="token function">handler</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">switch</span><span class="token punctuation">(</span>xhr<span class="token punctuation">.</span>readyState<span class="token punctuation">)</span><span class="token punctuation">{</span>
        <span class="token keyword">case</span> <span class="token number">0</span><span class="token operator">:</span> <span class="token comment">//请求未初始化</span>
        console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"请求未初始化"</span><span class="token punctuation">)</span>
        <span class="token keyword">break</span><span class="token punctuation">;</span>
        <span class="token keyword">case</span> <span class="token number">1</span><span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span><span class="token constant">OPENED</span>
        console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"OPENED"</span><span class="token punctuation">)</span>
        <span class="token keyword">break</span><span class="token punctuation">;</span>
        <span class="token keyword">case</span> <span class="token number">2</span><span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span><span class="token constant">HEADERS_RECEIVED</span>
        console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"HEADERS_RECEIVED"</span><span class="token punctuation">)</span>
        <span class="token keyword">break</span><span class="token punctuation">;</span>
        <span class="token keyword">case</span> <span class="token number">3</span><span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span><span class="token constant">LOADING</span>  
        console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"LOADING"</span><span class="token punctuation">)</span>
        <span class="token keyword">break</span><span class="token punctuation">;</span>
        <span class="token keyword">case</span> <span class="token number">4</span><span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span><span class="token constant">DONE</span>
        <span class="token keyword">if</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>status <span class="token operator">==</span> <span class="token number">200</span><span class="token operator">||</span><span class="token keyword">this</span><span class="token punctuation">.</span>status <span class="token operator">==</span> <span class="token number">304</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
            console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>responseText<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
        console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"DONE"</span><span class="token punctuation">)</span>
        <span class="token keyword">break</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
   
<span class="token keyword">function</span> <span class="token function">callOtherDomain</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">if</span><span class="token punctuation">(</span>xhr<span class="token punctuation">)</span> <span class="token punctuation">{</span>    
    xhr<span class="token punctuation">.</span><span class="token function">open</span><span class="token punctuation">(</span><span class="token string">'GET'</span><span class="token punctuation">,</span> url<span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span>
    xhr<span class="token punctuation">.</span>onreadystatechange <span class="token operator">=</span> handler
    xhr<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
<span class="token function">callOtherDomain</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br><span class="line-number">22</span><br><span class="line-number">23</span><br><span class="line-number">24</span><br><span class="line-number">25</span><br><span class="line-number">26</span><br><span class="line-number">27</span><br><span class="line-number">28</span><br><span class="line-number">29</span><br><span class="line-number">30</span><br><span class="line-number">31</span><br><span class="line-number">32</span><br><span class="line-number">33</span><br></div></div><p>你可以在控制台测试下。首先通过浏览器打开www.geekbang.org，然后打开控制台，在控制台输入以上示例代码，再执行，会看到请求被 Block 了。控制台的提示信息如下：</p>
<div class="language-text ext-text line-numbers-mode"><pre v-pre class="language-text"><code>Access to XMLHttpRequest at 'https://time.geekbang.org/' from origin 'https://www.geekbang.org' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
</code></pre><div class="line-numbers" aria-hidden="true"><span class="line-number">1</span><br></div></div><p>因为 www.geekbang.org 和 time.geekbang.com 不属于一个域，所以以上访问就属于跨域访问了，这次访问失败就是由于跨域问题导致的。</p>
<h3 id="_2-https-混合内容的问题" tabindex="-1"><a class="header-anchor" href="#_2-https-混合内容的问题" aria-hidden="true">#</a> 2. HTTPS 混合内容的问题</h3>
<p>了解完跨域问题后，我们再来看看 HTTPS 的混合内容。HTTPS 混合内容是 HTTPS 页面中包含了不符合 HTTPS 安全要求的内容，比如包含了 HTTP 资源，通过 HTTP 加载的图像、视频、样式表、脚本等，都属于混合内容。</p>
<p>通常，如果 HTTPS 请求页面中使用混合内容，浏览器会针对 HTTPS 混合内容显示警告，用来向用户表明此 HTTPS 页面包含不安全的资源。比如打开站点 https://www.iteye.com/groups ，可以通过控制台看到混合内容的警告，参考下图：</p>
<p><img src="https://static001.geekbang.org/resource/image/4b/63/4b4a210a1e078d9a26fe31e6eab34963.png" alt="HTTPS 混合内容警告"></p>
<p>从上图可以看出，通过 HTML 文件加载的混合资源，虽然给出警告，但大部分类型还是能加载的。而使用 XMLHttpRequest 请求时，浏览器认为这种请求可能是攻击者发起的，会阻止此类危险的请求。比如我通过浏览器打开地址 https://www.iteye.com/groups ，然后通过控制台，使用 XMLHttpRequest 来请求 http://img-ads.csdn.net/2018/201811150919211586.jpg ，这时候请求就会报错，出错信息如下图所示：</p>
<p><img src="https://static001.geekbang.org/resource/image/46/a1/46c22d4e54815942c1a86f11b14516a1.png" alt="使用 XMLHttpRequest 混合资源失效"></p>
<h2 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> 总结</h2>
<p>好了，今天我们就讲到这里，下面我来总结下今天的内容。</p>
<p>首先我们介绍了回调函数和系统调用栈；接下来我们站在循环系统的视角，分析了 XMLHttpRequest 是怎么工作的；最后又说明了由于一些安全因素的限制，在使用 XMLHttpRequest 的过程中会遇到跨域问题和混合内容的问题。</p>
<p>本篇文章跨度比较大，不是单纯地讲一个问题，而是将回调类型、循环系统、网络请求和安全问题“串联”起来了。</p>
<p>对比<a href="/guide/16" target="_blank" rel="noopener noreferrer">上一篇文章<ExternalLinkIcon/></a>，setTimeout 是直接将延迟任务添加到延迟队列中，而 XMLHttpRequest 发起请求，是由浏览器的其他进程或者线程去执行，然后再将执行结果利用 IPC 的方式通知渲染进程，之后渲染进程再将对应的消息添加到消息队列中。如果你搞懂了 setTimeout 和 XMLHttpRequest 的工作机制后，再来理解其他 WebAPI 就会轻松很多了，因为大部分 WebAPI 的工作逻辑都是类似的。</p>
<h2 id="思考时间" tabindex="-1"><a class="header-anchor" href="#思考时间" aria-hidden="true">#</a> 思考时间</h2>
<p>网络安全很重要，但是又很容易被忽视，因为项目需求很少涉及到基础的 Web 安全。如果忽视了这些基础安全策略，在开发过程中会处处遇到安全策略挖下的“大坑”，所以对于一名开发者来说，Web 安全理论很重要，也必须要学好。</p>
<p>那么今天我留给你一道开放性的思考题：你认为作为一名开发工程师，要如何去高效地学习前端的 Web 安全理论呢？</p>
<p>欢迎在留言区与我分享你的想法，也欢迎你在留言区记录你的思考过程。感谢阅读，如果你觉得这篇文章对你有帮助的话，也欢迎把它分享给更多的朋友。</p>
</template>
