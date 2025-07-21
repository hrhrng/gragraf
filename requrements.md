- [] human-in-the-loop（hlp）
目前需要新增一个节点，human-in-the-loop节点，
1. 产品细节
新增节点，和分支节点相似，Approval以及Reject两个分支，Approval分支可以走一个分支，Reject分支走另一个分支。
运行时，走到hlp节点时，前端会通过stream的信息体感知到，那么渲染为一个弹窗，弹窗中包含一个输入框，用户确认或者拒绝，前端重新发起请求，其他流程和现在一样。
2. 技术细节：https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/
    1. 增加langgraph的persistence特性，保存中间执行状态。
    2. stream接口增加一个thread_id,用于支持langgraph的hlp特性。然后如果有hlp节点的话，整个周期会有两次请求，这两次请求都是走stream一个接口，通过thread_id来标识，通过langgraph的persistence特性来恢复状态。